import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

export const nginxLatency = new Trend('nginx_latency');
export const middlewareLatency = new Trend('middleware_latency');
export const totalLatency = new Trend('total_latency');
export const dnsLatency = new Trend('dns_latency');
export const tlsLatency = new Trend('tls_latency');

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export const options = {
  scenarios: {
    latency_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
    },
  },
  thresholds: {
    total_latency: ['p(95)<1500', 'avg<800'],
    nginx_latency: ['p(95)<100', 'avg<50'],
    middleware_latency: ['p(95)<1000', 'avg<500'],
  },
};

export function setup() {
  console.log('\n========================================================');
  console.log('          ANÁLISE DE LATÊNCIA DE REDE');
  console.log('========================================================\n');
  console.log('Este teste mede a latência em diferentes camadas:\n');
  console.log('   🔹 DNS resolution');
  console.log('   🔹 TCP connection (Nginx)');
  console.log('   🔹 TLS handshake');
  console.log('   🔹 Server processing (Middleware)');
  console.log('   🔹 Response transfer');
  console.log('');
  console.log('⏱️  Duração: 3 minutos com 10 VUs\n');
  console.log('Iniciando...\n');
}

export default function () {
  // Medir latência total
  const startTotal = Date.now();
  
  const loginResponse = http.post(`${API_URL}/auth/login`, 
    JSON.stringify({ username: 'fulano4', password: 'fulano4' }), {
    headers: { 'Content-Type': 'application/json' }
  });

  const totalTime = Date.now() - startTotal;
  totalLatency.add(totalTime);

  // Decompor latência usando timings do K6
  if (loginResponse && loginResponse.timings) {
    const timings = loginResponse.timings;
    
    // DNS lookup time
    if (timings.looking_up) {
      dnsLatency.add(timings.looking_up);
    }
    
    // TCP connection time (Nginx)
    if (timings.connecting) {
      nginxLatency.add(timings.connecting);
    }
    
    // TLS handshake time
    if (timings.tls_handshaking) {
      tlsLatency.add(timings.tls_handshaking);
    }
    
    // Server processing time (Middleware)
    if (timings.waiting) {
      middlewareLatency.add(timings.waiting);
    }
    
    // Log detalhado a cada 50 requisições
    if (__ITER % 50 === 0) {
      console.log(`[Iter ${__ITER}] Total: ${totalTime}ms | ` +
                  `Connect: ${timings.connecting.toFixed(2)}ms | ` +
                  `Waiting: ${timings.waiting.toFixed(2)}ms | ` +
                  `Receiving: ${timings.receiving.toFixed(2)}ms`);
    }
  }

  check(loginResponse, {
    'Request successful': (r) => r.status === 200,
    'Low latency': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}

export function handleSummary(data) {
  const avgTotal = data.metrics.total_latency.values.avg.toFixed(2);
  const p50Total = data.metrics.total_latency.values['p(50)'].toFixed(2);
  const p95Total = data.metrics.total_latency.values['p(95)'].toFixed(2);
  const p99Total = data.metrics.total_latency.values['p(99)'].toFixed(2);
  
  const avgNginx = data.metrics.nginx_latency.values.avg.toFixed(2);
  const p95Nginx = data.metrics.nginx_latency.values['p(95)'].toFixed(2);
  
  const avgMiddleware = data.metrics.middleware_latency.values.avg.toFixed(2);
  const p95Middleware = data.metrics.middleware_latency.values['p(95)'].toFixed(2);
  
  const avgDns = data.metrics.dns_latency ? data.metrics.dns_latency.values.avg.toFixed(2) : 'N/A';
  const avgTls = data.metrics.tls_latency ? data.metrics.tls_latency.values.avg.toFixed(2) : 'N/A';
  
  console.log('\n==========================================================');
  console.log('           ANÁLISE DE LATÊNCIA DE REDE');
  console.log('==========================================================\n');
  
  console.log('⏱️  LATÊNCIA TOTAL (End-to-End):');
  console.log(`   • Média:  ${avgTotal}ms`);
  console.log(`   • P50:    ${p50Total}ms`);
  console.log(`   • P95:    ${p95Total}ms`);
  console.log(`   • P99:    ${p99Total}ms`);
  console.log('');
  
  console.log('🌐 LATÊNCIA DE REDE (DNS + TCP):');
  console.log(`   • DNS Lookup:      ${avgDns}ms`);
  console.log(`   • TCP Connect:     ${avgNginx}ms (avg) | ${p95Nginx}ms (p95)`);
  console.log(`   • TLS Handshake:   ${avgTls}ms`);
  console.log('');
  
  console.log('⚙️  LATÊNCIA DE PROCESSAMENTO (Middleware):');
  console.log(`   • Server Wait:     ${avgMiddleware}ms (avg) | ${p95Middleware}ms (p95)`);
  console.log('');
  
  console.log('📊 DISTRIBUIÇÃO DA LATÊNCIA:');
  const networkOverhead = parseFloat(avgNginx);
  const processingTime = parseFloat(avgMiddleware);
  const totalAvg = parseFloat(avgTotal);
  
  const networkPercent = ((networkOverhead / totalAvg) * 100).toFixed(1);
  const processingPercent = ((processingTime / totalAvg) * 100).toFixed(1);
  
  console.log(`   • Overhead de Rede:    ${networkPercent}% (${avgNginx}ms)`);
  console.log(`   • Processamento:       ${processingPercent}% (${avgMiddleware}ms)`);
  console.log(`   • Transfer + Outros:   ${(100 - parseFloat(networkPercent) - parseFloat(processingPercent)).toFixed(1)}%`);
  console.log('');
  
  console.log('=== ANÁLISE E RECOMENDAÇÕES ===\n');
  
  if (parseFloat(avgTotal) < 500) {
    console.log('✅ EXCELENTE: Latência muito baixa!');
    console.log('   • Experiência de usuário será muito boa');
    console.log('   • Configuração de rede está ótima');
  } else if (parseFloat(avgTotal) < 1000) {
    console.log('✅ BOA: Latência aceitável');
    console.log('   • Experiência de usuário será boa');
    console.log('   • Sem ações necessárias');
  } else if (parseFloat(avgTotal) < 2000) {
    console.log('⚠️  ATENÇÃO: Latência elevada');
    console.log('   • Usuários podem perceber lentidão');
    console.log('   • Investigação recomendada');
  } else {
    console.log('❌ CRÍTICO: Latência muito alta!');
    console.log('   • Experiência de usuário será ruim');
    console.log('   • Ação imediata necessária');
  }
  
  console.log('');
  
  // Recomendações específicas baseadas na análise
  if (parseFloat(avgNginx) > 100) {
    console.log('🔴 PROBLEMA IDENTIFICADO: Alta latência de conexão TCP');
    console.log('   Possíveis causas:');
    console.log('   • Overhead da rede Docker bridge');
    console.log('   • Contenção de rede do host');
    console.log('');
    console.log('   Soluções:');
    console.log('   1. Usar network_mode: host (remove overhead)');
    console.log('   2. Verificar se há contenção de rede no host');
    console.log('   3. Aumentar limites de rede dos containers');
    console.log('');
  }
  
  if (parseFloat(avgMiddleware) > 800) {
    console.log('🔴 PROBLEMA IDENTIFICADO: Alto tempo de processamento');
    console.log('   Possíveis causas:');
    console.log('   • Código ineficiente no middleware');
    console.log('   • Falta de cache');
    console.log('   • CPU insuficiente');
    console.log('   • Comunicação síncrona com serviços externos');
    console.log('');
    console.log('   Soluções:');
    console.log('   1. Analisar código do middleware (profiling)');
    console.log('   2. Implementar cache (Redis/Memcached)');
    console.log('   3. Aumentar CPU dos containers');
    console.log('   4. Usar processamento assíncrono onde possível');
    console.log('');
  }
  
  if (parseFloat(networkPercent) > 30) {
    console.log('⚠️  ATENÇÃO: Overhead de rede significativo');
    console.log('   • Mais de 30% da latência é overhead de rede');
    console.log('   • Considere:');
    console.log('     - Colocar containers na mesma subnet');
    console.log('     - Usar network_mode: host');
    console.log('     - Avaliar se Docker bridge está otimizado');
    console.log('');
  }
  
  console.log('💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Comparar com teste de carga:');
  console.log('      • Latência aumenta sob carga?');
  console.log('      • Execute: teste-capacidade-maxima.js');
  console.log('');
  console.log('   2. Monitorar no Grafana:');
  console.log('      • Dashboard: HTTP Response Times');
  console.log('      • Verificar correlação com CPU/Memory');
  console.log('');
  console.log('   3. Analisar logs:');
  console.log('      • Buscar por slow queries (>500ms)');
  console.log('      • Identificar endpoints mais lentos');
  console.log('');
  console.log('==========================================================\n');

  return { 'stdout': JSON.stringify(data, null, 2) };
}
