import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const API_URL = 'http://host.docker.internal:8088/api/v1/web-algo';

const httpReqFailed = new Rate('http_req_failed');

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(95)<2000'],
  },
};

export function setup() {
  const loginPayload = JSON.stringify({
    username: 'fulano4',
    password: 'fulano4'
  });
  
  const loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status !== 200) {
    console.error('❌ Setup failed: Login unsuccessful');
    return { cookies: null };
  }
  
  let sessionId = '';
  const setCookieHeader = loginResponse.headers['Set-Cookie'];
  
  if (setCookieHeader) {
    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookieArray.forEach(cookie => {
      if (cookie.includes('sessionid=')) {
        const match = cookie.match(/sessionid=([^;]+)/);
        if (match) sessionId = match[1];
      }
    });
  }
  
  let userName = 'fulano4';
  try {
    const body = JSON.parse(loginResponse.body);
    userName = body.username || body.respostas || 'fulano4';
  } catch (e) {
    console.error('⚠️ Erro ao parsear response body');
  }
  
  console.log(`✅ Setup completo - sessionid: ${sessionId.substring(0, 8)}..., username: ${userName}`);
  
  return {
    cookies: `sessionid=${sessionId}; name=${userName}`,
    sessionId: sessionId,
    userName: userName
  };
}

export default function (data) {
  if (!data.cookies) {
    console.error('❌ Sem cookies válidos, abortando teste');
    return;
  }
  
  const params = {
    headers: {
      'Cookie': data.cookies,
    },
  };
  
  // CORREÇÃO: Usar GET com path variables (como o controller espera)
  const endpoints = [
    // Busca de problemas por chave "S"
    () => {
      return http.get(`${API_URL}/problems/key/S`, params);
    },
    
    // Detalhes do problema S00000050
    () => {
      return http.get(`${API_URL}/problems/S00000050/details`, params);
    },
    
    // Detalhes do problema S00000100
    () => {
      return http.get(`${API_URL}/problems/S00000100/details`, params);
    },
    
    // Detalhes do problema S00000150
    () => {
      return http.get(`${API_URL}/problems/S00000150/details`, params);
    },
  ];
  
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = randomEndpoint();
  
  const success = check(response, {
    'Request successful': (r) => r.status === 200 || r.status === 404 || r.status === 422,
    'Response time OK': (r) => r.timings.duration < 2000,
  });
  
  httpReqFailed.add(response.status !== 200 && response.status !== 404 && response.status !== 422);
  
  if (!success && response.status !== 404 && response.status !== 422) {
    console.log(`⚠️ Falha inesperada: status=${response.status}, url=${response.url}, body=${response.body.substring(0, 150)}`);
  }
  
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs.values.count;
  const failedReqs = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0;
  const successReqs = totalReqs - failedReqs;
  const successRate = totalReqs > 0 ? (successReqs / totalReqs * 100).toFixed(2) : '0.00';
  const p95 = data.metrics.http_req_duration.values['p(95)'].toFixed(0);
  
  console.log('\n=== ANÁLISE DE BALANCEAMENTO ===');
  console.log(`Total de requisições: ${totalReqs}`);
  console.log(`Requisições com sucesso (200/404/422): ${successReqs}`);
  console.log(`Taxa de sucesso: ${successRate}%`);
  console.log(`P95 Response Time: ${p95}ms`);
  console.log('\nDistribuição esperada: ~50% para cada middleware');
  console.log('\n💡 Para verificar distribuição real:');
  console.log('   docker logs middleware1 2>&1 | find /c "GET /api/v1/web-algo/problems"');
  console.log('   docker logs middleware2 2>&1 | find /c "GET /api/v1/web-algo/problems"');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
