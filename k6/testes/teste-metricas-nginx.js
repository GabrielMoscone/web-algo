import http from 'k6/http';
import { check, sleep } from 'k6';

const NGINX_STATUS_URL = 'http://nginx/nginx_status';

export const options = {
  scenarios: {
    metrics_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  console.log('\n========================================================');
  console.log('         VALIDAÇÃO DE MÉTRICAS DO NGINX');
  console.log('========================================================\n');
  
  // 1. Verificar se endpoint de status está acessível
  console.log('1️⃣  Verificando endpoint nginx_status...');
  const statusResponse = http.get(NGINX_STATUS_URL);
  
  const statusCheck = check(statusResponse, {
    'Nginx status acessível': (r) => r.status === 200,
    'Contém active connections': (r) => r.body.includes('Active connections'),
    'Contém server accepts': (r) => r.body.includes('server accepts'),
    'Contém reading/writing/waiting': (r) => r.body.includes('Reading') && r.body.includes('Writing'),
  });

  if (statusCheck) {
    console.log('   ✅ Nginx status endpoint funcionando\n');
    console.log('   📊 Métricas disponíveis:');
    console.log('   ' + statusResponse.body.split('\n').join('\n   '));
    console.log('');
  } else {
    console.log('   ❌ Nginx status endpoint com problemas\n');
  }

  sleep(1);

  // 2. Verificar se nginx-exporter está funcionando
  console.log('2️⃣  Verificando Nginx Prometheus Exporter...');
  const exporterResponse = http.get('http://nginx-exporter:9113/metrics');
  
  const exporterCheck = check(exporterResponse, {
    'Nginx exporter acessível': (r) => r.status === 200,
    'Métricas Prometheus disponíveis': (r) => r.body.includes('nginx_'),
    'Métrica de conexões': (r) => r.body.includes('nginx_connections_active'),
    'Métrica de requests': (r) => r.body.includes('nginx_http_requests_total'),
  });

  if (exporterCheck) {
    console.log('   ✅ Nginx Prometheus Exporter funcionando\n');
    
    // Extrair algumas métricas importantes
    const lines = exporterResponse.body.split('\n');
    console.log('   📈 Métricas principais do Nginx:');
    lines.forEach(line => {
      if (line.includes('nginx_connections_active') ||
          line.includes('nginx_http_requests_total') ||
          line.includes('nginx_connections_accepted')) {
        if (!line.startsWith('#')) {
          console.log(`      ${line}`);
        }
      }
    });
    console.log('');
  } else {
    console.log('   ❌ Nginx exporter com problemas\n');
  }

  sleep(1);

  // 3. Verificar se Prometheus está coletando métricas
  console.log('3️⃣  Verificando coleta de métricas no Prometheus...');
  const promResponse = http.get('http://prometheus:9090/api/v1/query?query=nginx_connections_active');
  
  const promCheck = check(promResponse, {
    'Prometheus acessível': (r) => r.status === 200,
    'Prometheus tem dados do Nginx': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.data && data.data.result && data.data.result.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (promCheck) {
    console.log('   ✅ Prometheus coletando métricas do Nginx\n');
    try {
      const data = JSON.parse(promResponse.body);
      if (data.data && data.data.result && data.data.result.length > 0) {
        console.log('   📊 Últimos valores coletados:');
        data.data.result.forEach((result, idx) => {
          console.log(`      [${idx + 1}] ${result.metric.__name__}: ${result.value[1]}`);
        });
        console.log('');
      }
    } catch (e) {
      console.log('   ⚠️  Não foi possível parsear resposta do Prometheus');
    }
  } else {
    console.log('   ❌ Prometheus não está coletando dados do Nginx\n');
  }

  sleep(1);

  // 4. Verificar cAdvisor
  console.log('4️⃣  Verificando cAdvisor (métricas de containers)...');
  const cadvisorResponse = http.get('http://cadvisor:8080/metrics');
  
  const cadvisorCheck = check(cadvisorResponse, {
    'cAdvisor acessível': (r) => r.status === 200,
    'Métricas de container disponíveis': (r) => r.body.includes('container_cpu'),
  });

  if (cadvisorCheck) {
    console.log('   ✅ cAdvisor funcionando - métricas de CPU/Memória disponíveis\n');
  } else {
    console.log('   ❌ cAdvisor com problemas\n');
  }

  console.log('========================================================');
  console.log('                      RESUMO');
  console.log('========================================================\n');
  
  if (statusCheck && exporterCheck && promCheck && cadvisorCheck) {
    console.log('🎉 TUDO OK! Stack de monitoramento está funcionando perfeitamente\n');
  } else {
    console.log('⚠️  ATENÇÃO: Alguns componentes precisam de atenção\n');
  }
  
  console.log('📊 Acesse os painéis:');
  console.log('   • Grafana:    http://localhost:3000 (admin/admin)');
  console.log('   • Prometheus: http://localhost:9090');
  console.log('   • cAdvisor:   http://localhost:8082');
  console.log('');
  console.log('💡 Dashboards recomendados no Grafana:');
  console.log('   • Docker and System Monitoring (ID: 893)');
  console.log('   • Nginx Metrics (ID: 12708)');
  console.log('   • K6 Load Testing Results (ID: 2587)');
  console.log('\n========================================================\n');
}
