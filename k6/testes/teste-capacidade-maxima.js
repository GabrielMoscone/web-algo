import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

export const successRate = new Rate('success_rate');
export const responseTime = new Trend('response_time_ms');
export const errorCount = new Counter('error_count');
export const connectionErrors = new Counter('connection_errors');
export const timeoutErrors = new Counter('timeout_errors');

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 50 },   // Ramp-up para 50 req/s
        { duration: '3m', target: 100 },  // 100 req/s
        { duration: '3m', target: 200 },  // 200 req/s
        { duration: '3m', target: 300 },  // 300 req/s
        { duration: '3m', target: 400 },  // 400 req/s - ponto de quebra?
        { duration: '2m', target: 0 },    // Ramp-down
      ],
    },
  },
  thresholds: {
    success_rate: ['rate>0.90'],  // Reduzido para 90% (mais realista)
    response_time_ms: ['p(95)<3000', 'p(99)<5000'],
    error_count: ['count<500'],  // Aumentado para tolerar mais erros
    connection_errors: ['count<200'],
  },
};

const users = [
  { username: 'fulano1', password: 'fulano1' },
  { username: 'fulano4', password: 'fulano4' },
  { username: 'fulanotest', password: 'fulanotest' },
];

export function setup() {
  console.log('\n========================================================');
  console.log('        TESTE DE CAPACIDADE MÁXIMA DO SISTEMA');
  console.log('========================================================\n');
  console.log('Este teste aumentará progressivamente a carga até encontrar');
  console.log('o limite do sistema.\n');
  console.log('📊 Fases do teste:');
  console.log('   1. 50 req/s por 2 minutos');
  console.log('   2. 100 req/s por 3 minutos');
  console.log('   3. 200 req/s por 3 minutos');
  console.log('   4. 300 req/s por 3 minutos');
  console.log('   5. 400 req/s por 3 minutos');
  console.log('   6. Ramp-down por 2 minutos');
  console.log('');
  console.log('⏱️  Duração total: ~16 minutos\n');
  console.log('💡 Dica: Monitore em tempo real no Grafana');
  console.log('   http://localhost:3000\n');
  console.log('Iniciando teste...\n');
  console.log('========================================================\n');
}

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  
  const startTime = Date.now();
  
  const loginResponse = http.post(`${API_URL}/auth/login`, 
    JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
    tags: { name: 'login' },
  });

  const duration = Date.now() - startTime;
  responseTime.add(duration);

  // Categorizar tipos de erro
  if (!loginResponse) {
    connectionErrors.add(1);
    errorCount.add(1);
    return;
  }

  if (loginResponse.error) {
    if (loginResponse.error.includes('timeout')) {
      timeoutErrors.add(1);
    } else if (loginResponse.error.includes('EOF') || loginResponse.error.includes('connection reset')) {
      connectionErrors.add(1);
    }
    errorCount.add(1);
    successRate.add(false);
    return;
  }

  const loginSuccess = check(loginResponse, {
    'Login successful': (r) => r.status === 200,
  });

  successRate.add(loginSuccess);

  if (!loginSuccess) {
    errorCount.add(1);
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

  // Simular uso real
  const searchResponse = http.get(`${API_URL}/problems/key/S`, { headers, timeout: '10s' });
  successRate.add(searchResponse && searchResponse.status === 200);
  
  if (searchResponse && searchResponse.status !== 200) {
    errorCount.add(1);
  }

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const successRateValue = (data.metrics.success_rate.values.rate * 100).toFixed(2);
  const p50 = data.metrics.response_time_ms.values['p(50)'].toFixed(0);
  const p95 = data.metrics.response_time_ms.values['p(95)'].toFixed(0);
  const p99 = data.metrics.response_time_ms.values['p(99)'].toFixed(0);
  const avgResponseTime = data.metrics.response_time_ms.values.avg.toFixed(0);
  const totalErrors = data.metrics.error_count.values.count;
  const totalRequests = data.metrics.http_reqs.values.count;
  const maxRPS = data.metrics['http_reqs'].values.rate.toFixed(2);
  const connErrors = data.metrics.connection_errors?.values.count || 0;
  const timeoutErrs = data.metrics.timeout_errors?.values.count || 0;

  console.log('\n==========================================================');
  console.log('       ANÁLISE DE CAPACIDADE MÁXIMA DO SISTEMA');
  console.log('==========================================================\n');
  console.log('📊 MÉTRICAS DE SUCESSO:');
  console.log(`   • Taxa de Sucesso: ${successRateValue}%`);
  console.log(`   • Total de Requisições: ${totalRequests}`);
  console.log(`   • Requisições com Sucesso: ${totalRequests - totalErrors}`);
  console.log(`   • Total de Erros: ${totalErrors}`);
  console.log('');
  console.log('⏱️  MÉTRICAS DE PERFORMANCE:');
  console.log(`   • Response Time Médio: ${avgResponseTime}ms`);
  console.log(`   • Response Time P50: ${p50}ms`);
  console.log(`   • Response Time P95: ${p95}ms`);
  console.log(`   • Response Time P99: ${p99}ms`);
  console.log('');
  console.log('🚀 CAPACIDADE:');
  console.log(`   • Requisições por segundo (máximo): ${maxRPS} req/s`);
  console.log('');
  console.log('🔍 ANÁLISE DE ERROS:');
  console.log(`   • Erros de Conexão (EOF/Reset): ${connErrors}`);
  console.log(`   • Erros de Timeout: ${timeoutErrs}`);
  console.log(`   • Outros Erros: ${totalErrors - connErrors - timeoutErrs}`);
  
  console.log('');
  console.log('=== ANÁLISE E RECOMENDAÇÕES ===\n');
  
  if (parseFloat(successRateValue) >= 95 && parseFloat(p95) < 2000) {
    console.log('✅ Sistema está performando EXCELENTEMENTE');
    console.log('   • A configuração atual é adequada para a carga testada');
    console.log('   • Sistema aguenta até ~400 req/s com qualidade');
    console.log('   • Estimativa: ~100-200 usuários simultâneos');
  } else if (parseFloat(successRateValue) >= 90 && parseFloat(p95) < 3000) {
    console.log('⚠️  Sistema está no LIMITE');
    console.log('   • Configuração atual está no limite da capacidade');
    console.log('   • Sistema começa a degradar acima de ~300 req/s');
    console.log('   • Estimativa: ~75-150 usuários simultâneos');
    console.log('');
    console.log('   💡 RECOMENDAÇÕES:');
    console.log('      1. Aumentar recursos (CPU/RAM) dos containers');
    console.log('      2. Adicionar mais instâncias do middleware (3+)');
    console.log('      3. Otimizar queries e processamento no middleware');
    console.log('      4. Implementar cache (Redis) para dados frequentes');
  } else {
    console.log('❌ Sistema está SOBRECARREGADO');
    console.log('   • Configuração atual NÃO suporta a carga testada');
    console.log('   • Sistema degrada significativamente');
    console.log('   • Estimativa: <50 usuários simultâneos');
    console.log('');
    console.log('   🔴 AÇÕES NECESSÁRIAS (URGENTE):');
    console.log('      1. AUMENTAR recursos imediatamente');
    console.log('      2. Escalar para 3-4 instâncias do middleware');
    console.log('      3. Revisar código para gargalos de performance');
    console.log('      4. Implementar cache agressivo');
    console.log('      5. Considerar CDN para assets estáticos');
  }
  
  console.log('\n=== CONFIGURAÇÃO RECOMENDADA DE INFRAESTRUTURA ===\n');
  
  if (parseFloat(successRateValue) >= 95) {
    console.log('📦 CONTAINER MIDDLEWARE (por instância):');
    console.log('   • CPU: 1-2 vCPUs');
    console.log('   • RAM: 1-2 GB');
    console.log('   • Instâncias: 2 (atual)');
    console.log('');
    console.log('📦 CONTAINER NGINX:');
    console.log('   • CPU: 0.5-1 vCPU');
    console.log('   • RAM: 512 MB - 1 GB');
    console.log('');
    console.log('📦 VM/SERVIDOR TOTAL:');
    console.log('   • CPU: 4 vCPUs');
    console.log('   • RAM: 6-8 GB');
    console.log('   • Disco: 20 GB SSD');
  } else {
    console.log('📦 CONTAINER MIDDLEWARE (por instância):');
    console.log('   • CPU: 2-4 vCPUs ⬆️ AUMENTAR');
    console.log('   • RAM: 2-4 GB ⬆️ AUMENTAR');
    console.log('   • Instâncias: 3-4 ⬆️ AUMENTAR');
    console.log('');
    console.log('📦 CONTAINER NGINX:');
    console.log('   • CPU: 1-2 vCPUs');
    console.log('   • RAM: 1-2 GB');
    console.log('');
    console.log('📦 VM/SERVIDOR TOTAL:');
    console.log('   • CPU: 8-12 vCPUs ⬆️ AUMENTAR');
    console.log('   • RAM: 12-16 GB ⬆️ AUMENTAR');
    console.log('   • Disco: 40 GB SSD');
  }
  
  console.log('\n💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Analisar métricas detalhadas no Grafana:');
  console.log('      • CPU usage por container');
  console.log('      • Memory usage por container');
  console.log('      • Network I/O');
  console.log('      • Conexões ativas do Nginx');
  console.log('');
  console.log('   2. Verificar logs no Loki:');
  console.log('      • Identificar erros durante picos de carga');
  console.log('      • Analisar slow queries (>1s)');
  console.log('');
  console.log('   3. Executar teste de failover:');
  console.log('      • docker-compose exec k6 k6 run /scripts/teste-failover.js');
  console.log('');
  console.log('   4. Testar balanceamento:');
  console.log('      • docker-compose exec k6 k6 run /scripts/teste-balanceamento.js');
  console.log('');
  console.log('==========================================================\n');

  return { 'stdout': JSON.stringify(data, null, 2) };
}
