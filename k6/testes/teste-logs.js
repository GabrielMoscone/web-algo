import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;
const LOKI_URL = 'http://loki:3100';

export const options = {
  scenarios: {
    log_validation: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
    },
  },
};

export default function () {
  // Gerar algumas requisições para criar logs
  const loginResponse = http.post(`${API_URL}/auth/login`, 
    JSON.stringify({ username: 'fulano4', password: 'fulano4' }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status === 200) {
    const jar = http.cookieJar();
    const cookies = jar.cookiesForURL(loginResponse.url);
    let sessionId = '', userName = '';
    
    for (const [name, values] of Object.entries(cookies)) {
      if (name === 'sessionid') sessionId = values[0];
      if (name === 'name') userName = values[0];
    }

    const headers = { 'Cookie': `sessionid=${sessionId}; name=${userName}` };
    
    // Gerar diferentes tipos de requisições para logs variados
    http.get(`${API_URL}/problems/key/S`, { headers });
    http.get(`${API_URL}/problems/S00000050/details`, { headers });
    http.post(`${API_URL}/solutions`, 
      JSON.stringify({ problemCode: 'S00000050' }), 
      { headers: { ...headers, 'Content-Type': 'application/json' } });
  }

  sleep(1);
}

export function setup() {
  console.log('\n========================================================');
  console.log('         VALIDAÇÃO DO PIPELINE DE LOGS');
  console.log('========================================================\n');
  console.log('Gerando tráfego para criar logs...');
  console.log('Aguarde 2 minutos enquanto os logs são gerados e coletados.\n');
}

export function teardown() {
  console.log('\n========================================================');
  console.log('         ANÁLISE DA COLETA DE LOGS');
  console.log('========================================================\n');
  
  // Aguardar logs serem coletados
  console.log('⏳ Aguardando 10 segundos para logs serem coletados pelo Promtail...');
  sleep(10);
  
  // Verificar se Loki está pronto
  console.log('\n1️⃣  Verificando status do Loki...');
  const lokiReadyResponse = http.get(`${LOKI_URL}/ready`);
  const lokiReady = check(lokiReadyResponse, {
    'Loki está pronto': (r) => r.status === 200,
  });

  if (lokiReady) {
    console.log('   ✅ Loki está operacional\n');
    
    // Query para verificar logs do Nginx
    console.log('2️⃣  Buscando logs do Nginx no Loki...');
    const now = Date.now() * 1000000; // nanoseconds
    const oneHourAgo = (Date.now() - 3600000) * 1000000;
    const query = encodeURIComponent('{container_name=~"nginx"}');
    const lokiQueryResponse = http.get(
      `${LOKI_URL}/loki/api/v1/query_range?query=${query}&start=${oneHourAgo}&end=${now}&limit=10`
    );
    
    const hasNginxLogs = check(lokiQueryResponse, {
      'Loki recebendo logs do Nginx': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.result && data.data.result.length > 0;
        } catch {
          return false;
        }
      },
    });

    if (hasNginxLogs) {
      console.log('   ✅ Logs do Nginx sendo coletados pelo Loki\n');
      try {
        const data = JSON.parse(lokiQueryResponse.body);
        if (data.data && data.data.result && data.data.result.length > 0) {
          console.log('   📝 Últimos logs coletados:');
          data.data.result.forEach((stream, idx) => {
            console.log(`      [Stream ${idx + 1}] ${JSON.stringify(stream.stream)}`);
            if (stream.values && stream.values.length > 0) {
              stream.values.slice(0, 3).forEach(([timestamp, line]) => {
                const date = new Date(parseInt(timestamp) / 1000000).toISOString();
                console.log(`         ${date}: ${line.substring(0, 80)}...`);
              });
            }
          });
          console.log('');
        }
      } catch (e) {
        console.log('   ⚠️  Erro ao parsear resposta do Loki');
      }
    } else {
      console.log('   ⚠️  Nenhum log do Nginx encontrado no Loki\n');
    }

    // Query para verificar logs do Middleware
    console.log('3️⃣  Buscando logs do Middleware no Loki...');
    const middlewareQuery = encodeURIComponent('{container_name=~"middleware.*"}');
    const middlewareLogsResponse = http.get(
      `${LOKI_URL}/loki/api/v1/query_range?query=${middlewareQuery}&start=${oneHourAgo}&end=${now}&limit=10`
    );
    
    const hasMiddlewareLogs = check(middlewareLogsResponse, {
      'Loki recebendo logs do Middleware': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.result && data.data.result.length > 0;
        } catch {
          return false;
        }
      },
    });

    if (hasMiddlewareLogs) {
      console.log('   ✅ Logs do Middleware sendo coletados pelo Loki\n');
    } else {
      console.log('   ⚠️  Nenhum log do Middleware encontrado no Loki\n');
    }

  } else {
    console.log('   ❌ Loki não está acessível\n');
  }

  console.log('========================================================');
  console.log('                      RESUMO');
  console.log('========================================================\n');
  
  if (lokiReady) {
    console.log('✅ Pipeline de logs está configurado\n');
  } else {
    console.log('❌ Pipeline de logs precisa de atenção\n');
  }

  console.log('📊 Para visualizar logs no Grafana:');
  console.log('   1. Acesse: http://localhost:3000/explore');
  console.log('   2. Selecione: Data Source > Loki');
  console.log('   3. Query sugeridas:');
  console.log('      • {container_name="nginx"}');
  console.log('      • {container_name=~"middleware.*"}');
  console.log('      • {container_name="nginx"} |= "error"');
  console.log('      • {container_name=~"middleware.*"} |= "ERROR"');
  console.log('');
  console.log('💡 Logs são essenciais para:');
  console.log('   • Troubleshooting de erros em produção');
  console.log('   • Análise de performance (slow queries)');
  console.log('   • Auditoria e segurança');
  console.log('   • Identificação de padrões de uso');
  console.log('\n========================================================\n');
}
