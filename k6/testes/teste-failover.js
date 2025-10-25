import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

export const availabilityRate = new Rate('availability_rate');
export const errorsDuringFailover = new Counter('errors_during_failover');

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export const options = {
  scenarios: {
    failover_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10m', // Tempo para derrubar e subir container manualmente
    },
  },
  thresholds: {
    availability_rate: ['rate>0.95'], // 95% de disponibilidade
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const loginResponse = http.post(`${API_URL}/auth/login`, 
    JSON.stringify({ username: 'fulano4', password: 'fulano4' }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  const available = check(loginResponse, {
    'Login successful': (r) => r.status === 200,
    'Response time acceptable': (r) => r.timings.duration < 5000,
  });
  
  availabilityRate.add(available);

  if (!available) {
    errorsDuringFailover.add(1);
    console.log(`❌ Login failed at ${new Date().toISOString()}`);
    sleep(2);
    return;
  }

  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(loginResponse.url);
  let sessionId = '', userName = '';
  
  for (const [name, values] of Object.entries(cookies)) {
    if (name === 'sessionid') sessionId = values[0];
    if (name === 'name') userName = values[0];
  }

  const headers = { 'Cookie': `sessionid=${sessionId}; name=${userName}` };

  // Fazer requisições contínuas
  const searchResponse = http.get(`${API_URL}/problems/key/S`, { 
    headers,
    timeout: '10s',
  });
  
  const searchAvailable = check(searchResponse, {
    'Search available': (r) => r.status === 200,
    'Search response time OK': (r) => r.timings.duration < 5000,
  });
  
  availabilityRate.add(searchAvailable);
  
  if (!searchAvailable) {
    errorsDuringFailover.add(1);
    console.log(`⚠️ Search failed at ${new Date().toISOString()}`);
  }

  sleep(2);
}

export function setup() {
  console.log('\n=== TESTE DE FAILOVER ===');
  console.log('Este teste simula falha de uma instância do middleware\n');
  console.log('📋 INSTRUÇÕES:');
  console.log('1. O teste iniciará com 2 instâncias rodando');
  console.log('2. Após ~2 minutos, execute em outro terminal:');
  console.log('   docker stop middleware1');
  console.log('3. Aguarde ~3 minutos (sistema operando com 1 instância)');
  console.log('4. Execute:');
  console.log('   docker start middleware1');
  console.log('5. Aguarde o teste completar (~5 minutos restantes)\n');
  console.log('Iniciando teste...\n');
}

export function handleSummary(data) {
  const availability = (data.metrics.availability_rate.values.rate * 100).toFixed(2);
  const errorRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
  const totalErrors = data.metrics.errors_during_failover.values.count;
  const p95 = data.metrics.http_req_duration.values['p(95)'].toFixed(0);
  
  console.log('\n========================================================');
  console.log('           RESULTADO DO TESTE DE FAILOVER');
  console.log('========================================================\n');
  console.log(`✅ Disponibilidade durante o teste: ${availability}%`);
  console.log(`❌ Taxa de erro: ${errorRate}%`);
  console.log(`🔢 Total de erros: ${totalErrors}`);
  console.log(`⏱️  Response Time P95: ${p95}ms`);
  
  console.log('\n=== ANÁLISE ===');
  if (parseFloat(availability) >= 95) {
    console.log('✅ SUCESSO: Sistema manteve alta disponibilidade durante failover');
    console.log('   O load balancer está funcionando corretamente');
  } else if (parseFloat(availability) >= 80) {
    console.log('⚠️  ATENÇÃO: Disponibilidade aceitável mas pode melhorar');
    console.log('   Considere: health checks mais frequentes, timeout menor');
  } else {
    console.log('❌ FALHA: Baixa disponibilidade durante failover');
    console.log('   Verificar: configuração do Nginx, health checks, keep-alive');
  }
  
  console.log('\n💡 Próximos passos:');
  console.log('   1. Verificar logs: docker logs nginx');
  console.log('   2. Analisar métricas no Grafana');
  console.log('   3. Ajustar configurações de timeout se necessário');
  console.log('\n========================================================\n');
  
  return { 'stdout': JSON.stringify(data, null, 2) };
}
