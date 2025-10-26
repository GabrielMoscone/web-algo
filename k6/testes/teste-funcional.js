import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas para teste de funcionalidade
export const functionalTestSuccess = new Rate('functional_test_success');
export const endpointResponseTime = new Trend('endpoint_response_time');

export const options = {
  scenarios: {
    functional_test: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '10m',
    },
  },
  thresholds: {
    functional_test_success: ['rate>0.95'],
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export default function () {
  console.log('==================== TESTE FUNCIONAL ====================');
  
  // Suite completa de testes funcionais
  testStaticPages();
  testAuthFlow();
  testCompleteAuthenticatedFlow();
  testAPIEndpoints();
  testErrorHandling();
  
  console.log('Teste funcional concluído');
}

function testStaticPages() {
  console.log('Testando páginas estáticas...');
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login.html', name: 'Login' },
    { path: '/cadastro.html', name: 'Cadastro' },
    { path: '/recuperar-senha.html', name: 'Recuperar Senha' },
  ];
  
  pages.forEach(page => {
    const response = http.get(`${BASE_URL}${page.path}`);
    
    const success = check(response, {
      [`${page.name} page loads (status 200-302)`]: (r) => [200, 302].includes(r.status),
      [`${page.name} page loads quickly`]: (r) => r.timings.duration < 3000,
      [`${page.name} page has content`]: (r) => r.body && r.body.length > 100,
    });
    
    functionalTestSuccess.add(success, { test: `static_page_${page.name.toLowerCase()}` });
    endpointResponseTime.add(response.timings.duration, { endpoint: page.path });
    
    console.log(`${page.name}: ${response.status} (${response.timings.duration}ms)`);
  });
}

function testAuthFlow() {
  console.log('Testando fluxo de autenticação...');
  
  // Teste de login com credenciais inválidas
  const invalidLoginPayload = JSON.stringify({
    username: 'invalid_user',
    password: 'invalid_pass'
  });
  
  const invalidLoginResponse = http.post(`${API_URL}/auth/login`, invalidLoginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const invalidLoginCheck = check(invalidLoginResponse, {
    'Invalid login returns 401': (r) => r.status === 401,
    'Invalid login response time OK': (r) => r.timings.duration < 10000, // Aumentado para 10s
  });
  
  functionalTestSuccess.add(invalidLoginCheck, { test: 'invalid_login' });
  console.log(`Login inválido: ${invalidLoginResponse.status} (${invalidLoginResponse.timings.duration}ms)`);
  
  // Teste de endpoints que requerem autenticação sem cookie
  const unauthenticatedResponse = http.get(`${API_URL}/problems/key/C`);
  
  const unauthCheck = check(unauthenticatedResponse, {
    'Unauthenticated request returns 400 or 401': (r) => [400, 401].includes(r.status),
    'Unauthenticated response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(unauthCheck, { test: 'unauthenticated_api' });
  console.log(`API sem auth: ${unauthenticatedResponse.status} (${unauthenticatedResponse.timings.duration}ms)`);
}

function testCompleteAuthenticatedFlow() {
  console.log('Testando fluxo autenticado completo...');
  
  const loginPayload = JSON.stringify({
    username: 'fulano4',
    password: 'fulano4'
  });
  
  const loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginCheck = check(loginResponse, {
    'Valid login returns 200': (r) => r.status === 200,
    'Valid login returns username': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.username === 'fulano4';
      } catch {
        return false;
      }
    },
    'Valid login sets cookies': (r) => {
      const cookies = r.headers['Set-Cookie'];
      return cookies != null && cookies.toString().includes('sessionid=');
    },
  });
  
  functionalTestSuccess.add(loginCheck, { test: 'valid_login' });
  console.log(`Login válido: ${loginResponse.status} (${loginResponse.timings.duration}ms)`);
  
  if (loginResponse.status !== 200) {
    console.log('⚠️ Login falhou, pulando testes autenticados');
    return;
  }
  
  // CORREÇÃO: Capturar sessionid do header Set-Cookie
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
  
  // CORREÇÃO: Obter username do response body (não vem como cookie)
  let userName = '';
  try {
    const body = JSON.parse(loginResponse.body);
    userName = body.username || body.respostas || 'fulano4';
  } catch (e) {
    console.log(`⚠️ Erro ao parsear response body: ${e}`);
    userName = 'fulano4';
  }
  
  if (!sessionId) {
    console.log(`❌ Cookie sessionid não encontrado!`);
    functionalTestSuccess.add(false, { test: 'cookie_capture' });
    return;
  }
  
  console.log(`✅ Cookies capturados - sessionid: ${sessionId.substring(0, 8)}..., name: ${userName}`);
  functionalTestSuccess.add(true, { test: 'cookie_capture' });
  
  // CORREÇÃO: Criar cookie 'name' manualmente (como o frontend faz)
  const cookieHeader = `sessionid=${sessionId}; name=${userName}`;
  
  const authParams = {
    headers: {
      'Cookie': cookieHeader,
    },
  };
  
  // Teste busca autenticada de problemas
  sleep(1);
  const searchResponse = http.get(`${API_URL}/problems/key/S`, authParams);
  
  const searchCheck = check(searchResponse, {
    'Authenticated search returns 200 or 404': (r) => [200, 404].includes(r.status),
    'Authenticated search response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(searchCheck, { test: 'authenticated_search' });
  console.log(`Busca autenticada: ${searchResponse.status} (${searchResponse.timings.duration}ms)`);
  
  // Teste busca de detalhes de problema
  sleep(1);
  const problemDetailsResponse = http.get(`${API_URL}/problems/S00000050/details`, authParams);
  
  const problemCheck = check(problemDetailsResponse, {
    'Problem details returns 200, 404 or 422': (r) => [200, 404, 422].includes(r.status),
    'Problem details response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(problemCheck, { test: 'authenticated_problem_details' });
  console.log(`Detalhes do problema: ${problemDetailsResponse.status} (${problemDetailsResponse.timings.duration}ms)`);
  
  // Teste logout
  sleep(1);
  const logoutPayload = JSON.stringify({ username: userName });
  const logoutResponse = http.post(`${API_URL}/auth/logout`, logoutPayload, {
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
  });
  
  const logoutCheck = check(logoutResponse, {
    'Logout returns 200': (r) => r.status === 200,
    'Logout response time OK': (r) => r.timings.duration < 2000,
  });
  
  functionalTestSuccess.add(logoutCheck, { test: 'logout' });
  console.log(`Logout: ${logoutResponse.status} (${logoutResponse.timings.duration}ms)`);
}

function testAPIEndpoints() {
  console.log('Testando endpoints da API...');
  
  const endpoints = [
    { path: '/problems/key/S', expectedStatus: [400, 401, 404] },
    { path: '/problems/S00000050/details', expectedStatus: [400, 401, 404, 422] },
    { path: '/solutions/S001_S00000050/details', expectedStatus: [400, 401, 404, 422] },
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${API_URL}${endpoint.path}`);
    
    const success = check(response, {
      [`${endpoint.path} returns expected status`]: (r) => endpoint.expectedStatus.includes(r.status),
      [`${endpoint.path} responds quickly`]: (r) => r.timings.duration < 5000,
    });
    
    functionalTestSuccess.add(success, { test: `api_endpoint_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}` });
    endpointResponseTime.add(response.timings.duration, { endpoint: endpoint.path });
    
    console.log(`${endpoint.path}: ${response.status} (${response.timings.duration}ms)`);
  });
}

function testErrorHandling() {
  console.log('Testando tratamento de erros...');
  
  // Teste de requisição com payload inválido
  const invalidPayload = '{"invalid": json}';
  
  const invalidJsonResponse = http.post(`${API_URL}/auth/login`, invalidPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const invalidJsonCheck = check(invalidJsonResponse, {
    'Invalid JSON returns 400': (r) => r.status === 400,
    'Invalid JSON response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(invalidJsonCheck, { test: 'invalid_json' });
  console.log(`JSON inválido: ${invalidJsonResponse.status} (${invalidJsonResponse.timings.duration}ms)`);
  
  // Teste de método HTTP não permitido
  const wrongMethodResponse = http.del(`${API_URL}/auth/login`);
  
  const wrongMethodCheck = check(wrongMethodResponse, {
    'Wrong method returns 405': (r) => r.status === 405,
    'Wrong method response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(wrongMethodCheck, { test: 'wrong_method' });
  console.log(`Método errado: ${wrongMethodResponse.status} (${wrongMethodResponse.timings.duration}ms)`);
  
  // Teste de endpoint inexistente
  const notFoundResponse = http.get(`${API_URL}/nonexistent/endpoint`);
  
  const notFoundCheck = check(notFoundResponse, {
    'Nonexistent endpoint returns 404': (r) => r.status === 404,
    'Nonexistent endpoint response time OK': (r) => r.timings.duration < 3000,
  });
  
  functionalTestSuccess.add(notFoundCheck, { test: 'not_found' });
  console.log(`Endpoint inexistente: ${notFoundResponse.status} (${notFoundResponse.timings.duration}ms)`);
}

export function setup() {
  console.log('Iniciando teste funcional da aplicação Web-Algo');
  console.log('Verificando se aplicação está disponível...');
  
  const healthCheck = http.get(BASE_URL);
  if (![200, 302].includes(healthCheck.status)) {
    throw new Error(`Aplicação não está disponível: ${healthCheck.status}`);
  }
  
  console.log('Aplicação disponível. Iniciando testes...');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('==================== RESUMO ====================');
  console.log(`Teste iniciado em: ${data.startTime}`);
  console.log('Teste funcional concluído');
  console.log('Verifique os resultados detalhados no Grafana');
}