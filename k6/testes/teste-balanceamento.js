import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Métricas para rastrear distribuição
export const requestsToMiddleware1 = new Counter('requests_middleware1');
export const requestsToMiddleware2 = new Counter('requests_middleware2');
export const balanceRatio = new Trend('balance_ratio');

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Login para obter sessão
  const loginResponse = http.post(`${API_URL}/auth/login`, 
    JSON.stringify({ username: 'fulano4', password: 'fulano4' }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status !== 200) {
    sleep(1);
    return;
  }

  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(loginResponse.url);
  let sessionId = '', userName = '';
  
  for (const [name, values] of Object.entries(cookies)) {
    if (name === 'sessionid') sessionId = values[0];
    if (name === 'name') userName = values[0];
  }

  const headers = {
    'Cookie': `sessionid=${sessionId}; name=${userName}`
  };

  // Fazer múltiplas requisições para testar balanceamento
  for (let i = 0; i < 5; i++) {
    const response = http.get(`${API_URL}/problems/key/S`, { headers });
    
    // Tentar identificar qual middleware respondeu
    // Você pode adicionar um header customizado no middleware para identificar a instância
    const serverHeader = response.headers['X-Server-Instance'] || 'unknown';
    
    check(response, {
      'Request successful': (r) => r.status === 200,
      'Response time OK': (r) => r.timings.duration < 2000,
    });
    
    sleep(0.5);
  }

  // Logout
  http.post(`${API_URL}/auth/logout`, 
    JSON.stringify({ username: userName }), {
    headers: {
      'Cookie': `sessionid=${sessionId}; name=${userName}`,
      'Content-Type': 'application/json'
    }
  });
  
  sleep(1);
}

export function handleSummary(data) {
  // Calcular distribuição de carga
  console.log('\n=== ANÁLISE DE BALANCEAMENTO ===');
  console.log(`Total de requisições: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requisições com sucesso: ${data.metrics.http_reqs.values.count - (data.metrics.http_req_failed.values.count || 0)}`);
  console.log(`Taxa de sucesso: ${((1 - (data.metrics.http_req_failed.values.rate || 0)) * 100).toFixed(2)}%`);
  console.log(`P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log('\nDistribuição esperada: ~50% para cada middleware');
  console.log('\n💡 Para verificar distribuição real:');
  console.log('   docker logs middleware1 2>&1 | find /c "GET /api"');
  console.log('   docker logs middleware2 2>&1 | find /c "GET /api"');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
