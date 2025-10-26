import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

export const availabilityRate = new Rate('availability_rate');
export const errorsDuringFailover = new Counter('errors_during_failover');
export const errorsBeforeFailover = new Counter('errors_before_failover');
export const errorsAfterRecovery = new Counter('errors_after_recovery');
export const responseTimeByPhase = new Trend('response_time_by_phase');

const API_URL = 'http://host.docker.internal:8088/api/v1/web-algo';

export const options = {
  scenarios: {
    failover_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    'availability_rate': ['rate>0.95'],
    'http_req_duration': ['p(95)<3000'],
    'http_req_duration{phase:NORMAL}': ['p(95)<500'], // Limites por fase
    'http_req_duration{phase:FAILOVER}': ['p(95)<5000'], // Mais tolerante durante failover
    'http_req_duration{phase:RECOVERY}': ['p(95)<1000'],
  },
};

export function setup() {
  console.log('\n=== TESTE DE FAILOVER ===');
  console.log('⏱️  Fase 1 (0-2min): Sistema normal - Todas instâncias ativas');
  console.log('🔴 Fase 2 (2-3min): DESLIGUE UMA INSTÂNCIA - Testando failover');
  console.log('🟢 Fase 3 (3-5min): RELIGUE A INSTÂNCIA - Testando recuperação\n');
  
  const loginPayload = JSON.stringify({
    username: 'fulano4',
    password: 'fulano4'
  });
  
  const loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status !== 200) {
    console.error('❌ Setup failed: Login unsuccessful');
    return { cookies: null, startTime: Date.now() };
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
  
  console.log(`✅ Setup completo - sessionid: ${sessionId.substring(0, 8)}..., username: ${userName}\n`);
  console.log('🚀 Iniciando teste em 3 segundos...\n');
  
  return {
    cookies: `sessionid=${sessionId}; name=${userName}`,
    sessionId: sessionId,
    userName: userName,
    startTime: Date.now()
  };
}

function getCurrentPhase(elapsedSeconds) {
  if (elapsedSeconds < 120) {
    return 'NORMAL';
  } else if (elapsedSeconds < 180) {
    return 'FAILOVER';
  } else {
    return 'RECOVERY';
  }
}

export default function (data) {
  if (!data.cookies) {
    console.error('❌ Sem cookies válidos, abortando teste');
    availabilityRate.add(false);
    errorsDuringFailover.add(1);
    sleep(1);
    return;
  }
  
  const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
  const currentPhase = getCurrentPhase(elapsedSeconds);
  
  // Mensagens de alerta com menos repetição
  if (elapsedSeconds === 119) {
    console.log('\n⚠️  ===== EM 1 SEGUNDO: DESLIGUE UMA INSTÂNCIA DO MIDDLEWARE! =====\n');
  } else if (elapsedSeconds === 120) {
    console.log('\n🔴 ===== AGORA! DESLIGUE (docker-compose stop middleware-1) =====\n');
  } else if (elapsedSeconds === 179) {
    console.log('\n⚠️  ===== EM 1 SEGUNDO: RELIGUE A INSTÂNCIA! =====\n');
  } else if (elapsedSeconds === 180) {
    console.log('\n🟢 ===== AGORA! RELIGUE (docker-compose start middleware-1) =====\n');
  }
  
  const params = {
    headers: {
      'Cookie': data.cookies,
    },
    timeout: '10s',
    tags: { phase: currentPhase }, // Adiciona tags para métricas por fase
  };
  
  const endpoints = [
    () => http.get(`${API_URL}/problems/key/S`, params),
    () => http.get(`${API_URL}/problems/S00000050/details`, params),
    () => http.get(`${API_URL}/problems/S00000100/details`, params),
    () => http.get(`${API_URL}/problems/S00000150/details`, params),
    () => http.get(`${API_URL}/problems/key/B`, params),
  ];
  
  const numRequests = Math.floor(Math.random() * 2) + 2;
  
  for (let i = 0; i < numRequests; i++) {
    const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const response = randomEndpoint();
    
    const isAvailable = response.status === 200 || response.status === 404 || response.status === 422;
    
    check(response, {
      [`[${currentPhase}] Request available`]: (r) => isAvailable,
      [`[${currentPhase}] Response time OK`]: (r) => r.timings.duration < 3000,
    });
    
    availabilityRate.add(isAvailable);
    responseTimeByPhase.add(response.timings.duration, { phase: currentPhase });
    
    if (!isAvailable) {
      if (currentPhase === 'NORMAL') {
        errorsBeforeFailover.add(1);
      } else if (currentPhase === 'FAILOVER') {
        errorsDuringFailover.add(1);
        console.log(`⚠️  Erro durante failover: ${response.status} - ${response.timings.duration.toFixed(0)}ms`);
      } else {
        errorsAfterRecovery.add(1);
      }
    }
    
    sleep(0.3);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  const availability = (data.metrics.availability_rate.values.rate * 100).toFixed(2);
  const failRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : '0.00';
  
  const errorsNormal = data.metrics.errors_before_failover ? data.metrics.errors_before_failover.values.count : 0;
  const errorsFailover = data.metrics.errors_during_failover ? data.metrics.errors_during_failover.values.count : 0;
  const errorsRecovery = data.metrics.errors_after_recovery ? data.metrics.errors_after_recovery.values.count : 0;
  const totalErrors = errorsNormal + errorsFailover + errorsRecovery;
  
  const p95Overall = data.metrics.http_req_duration.values['p(95)'].toFixed(0);
  const avgOverall = data.metrics.http_req_duration.values['avg'].toFixed(0);
  const maxOverall = data.metrics.http_req_duration.values['max'].toFixed(0);
  const totalReqs = data.metrics.http_reqs.values.count;
  const reqRate = data.metrics.http_reqs.values.rate.toFixed(2);
  
  // Extrair métricas por fase
  const p95Normal = data.metrics['http_req_duration{phase:NORMAL}']?.values['p(95)']?.toFixed(0) || 'N/A';
  const p95Failover = data.metrics['http_req_duration{phase:FAILOVER}']?.values['p(95)']?.toFixed(0) || 'N/A';
  const p95Recovery = data.metrics['http_req_duration{phase:RECOVERY}']?.values['p(95)']?.toFixed(0) || 'N/A';
  
  console.log('\n========================================================');
  console.log('           RESULTADO DO TESTE DE FAILOVER');
  console.log('========================================================\n');
  console.log(`📊 Total de requisições: ${totalReqs} (${reqRate} req/s)`);
  console.log(`✅ Disponibilidade geral: ${availability}%`);
  console.log(`${parseFloat(availability) >= 95 ? '✅' : '❌'} Taxa de falha geral: ${failRate}%`);
  
  console.log('\n=== RESPONSE TIME (ms) ===');
  console.log(`📊 Média: ${avgOverall}ms | P95: ${p95Overall}ms | Max: ${maxOverall}ms`);
  console.log(`🟢 Fase Normal P95: ${p95Normal}ms`);
  console.log(`🔴 Fase Failover P95: ${p95Failover}ms`);
  console.log(`🟢 Fase Recovery P95: ${p95Recovery}ms`);
  
  console.log('\n=== ERROS POR FASE ===');
  console.log(`🟢 Fase Normal (0-2min): ${errorsNormal} erros`);
  console.log(`🔴 Fase Failover (2-3min): ${errorsFailover} erros`);
  console.log(`🟢 Fase Recovery (3-5min): ${errorsRecovery} erros`);
  console.log(`📊 Total de erros: ${totalErrors}`);
  
  console.log('\n=== ANÁLISE DETALHADA ===');
  if (parseFloat(availability) >= 95) {
    console.log('✅ SUCESSO: Sistema manteve alta disponibilidade (>95%)');
  } else if (parseFloat(availability) >= 80) {
    console.log('⚠️  ATENÇÃO: Disponibilidade aceitável mas abaixo do ideal');
  } else {
    console.log('❌ FALHA: Baixa disponibilidade durante failover');
  }
  
  if (errorsFailover > errorsNormal * 2) {
    console.log(`⚠️  Pico de ${errorsFailover}x mais erros durante failover vs normal`);
  } else if (errorsFailover === 0) {
    console.log('✅ Nenhum erro durante failover - Perfeito!');
  } else {
    console.log(`✅ Erros mínimos durante failover (${errorsFailover})`);
  }
  
  if (errorsRecovery < errorsFailover) {
    console.log('✅ Sistema se recuperou bem após religar a instância');
  } else if (errorsRecovery === 0 && errorsFailover === 0) {
    console.log('✅ Zero erros em todas as fases - Excelente!');
  }
  
  // Análise de performance
  if (parseInt(p95Failover) > parseInt(p95Normal) * 2) {
    console.log(`⚠️  Latência aumentou ${(parseInt(p95Failover) / parseInt(p95Normal)).toFixed(1)}x durante failover`);
  }
  
  if (parseInt(maxOverall) > 5000) {
    console.log(`⚠️  Pico de latência detectado: ${maxOverall}ms (considere ajustar timeouts)`);
  }
  
  console.log('\n========================================================\n');
  
  return { 'stdout': JSON.stringify(data, null, 2) };
}
