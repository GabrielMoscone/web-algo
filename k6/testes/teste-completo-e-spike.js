import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
export const loginSuccessRate = new Rate('login_success_rate');
export const apiResponseTime = new Trend('api_response_time');
export const failedRequests = new Counter('failed_requests');
export const authErrorsRate = new Rate('auth_errors_rate');
export const problemApiCalls = new Counter('problem_api_calls');
export const solutionApiCalls = new Counter('solution_api_calls');

// Configurações do teste
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 10 },   // Ramp-up para 10 usuários
        { duration: '5m', target: 10 },   // Mantém 10 usuários
        { duration: '2m', target: 50 },   // Ramp-up para 50 usuários
        { duration: '5m', target: 50 },   // Mantém 50 usuários
        { duration: '2m', target: 100 },  // Ramp-up para 100 usuários
        { duration: '5m', target: 100 },  // Mantém 100 usuários
        { duration: '3m', target: 0 },    // Ramp-down
      ],
    },
    spike_test: {
      executor: 'ramping-vus',
      startTime: '20m',
      stages: [
        { duration: '10s', target: 200 }, // Spike súbito
        { duration: '1m', target: 200 },  // Mantém spike
        { duration: '10s', target: 0 },   // Volta ao normal
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições < 2s
    http_req_failed: ['rate<0.1'],     // Taxa de erro < 10%
    login_success_rate: ['rate>0.9'],  // Taxa de sucesso do login > 90%
    auth_errors_rate: ['rate<0.05'],   // Taxa de erro de auth < 5%
  },
  httpDebug: 'error',
  discardResponseBodies: false,
  noConnectionReuse: false,
};

// Dados de teste compartilhados
const users = new SharedArray('users', function () {
  return [
    { username: 'fulano4', password: 'fulano4' },
    { username: 'fulano1', password: 'fulano1' },
    { username: 'fulanotest', password: 'fulanotest' },
    { username: 'user123', password: 'user123' },
    { username: 'user321', password: 'user321' },
  ];
});

const problemCodes = new SharedArray('problems', function () {
  return ['S00000050', 'S00000100', 'S00000200', 'S00000300', 'S00000400'];
});

const solutionsCodes = new SharedArray('solutions', function () {
  return ['S001_S00000050', 'S002_S00000050', 'S003_S00000050', 'S004_S00000050', 'S005_S00000050'];
});

const searchKeys = new SharedArray('searchKeys', function () {
  return ['S', 'V', 'C', 'G', 'I', 'M', 'F', 'R'];
});

// Configurações da aplicação
const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  console.log(`[VU ${__VU}] 🔄 Iniciando cenário para ${user.username}`);

  // Cenário de teste completo
  testHomePage();
  const sessionData = testLoginFlow(user);
  
  if (sessionData && sessionData.sessionId && sessionData.userName) {
    console.log(`[VU ${__VU}] ✅ Login bem-sucedido, executando testes de APIs...`);
    
    // Executa múltiplos testes de APIs para balancear a carga
    testProblemsAPI(sessionData);
    sleep(1);
    
    testSolutionsAPI(sessionData);
    sleep(1);
    
    // Testa novamente problemas (simula navegação do usuário)
    testProblemsSearchAPI(sessionData);
    sleep(1);
    
    testLogout(sessionData);
  } else {
    console.error(`[VU ${__VU}] ❌ Falha no login para ${user.username}, pulando testes de APIs`);
  }

  sleep(Math.random() * 3 + 1);
}

function testHomePage() {
  const response = http.get(BASE_URL);

  check(response, {
    'Home page status is 200 or 302': (r) => r && [200, 302].includes(r.status),
    'Home page response time < 1s': (r) => r && r.timings && r.timings.duration < 1000,
  });

  if (!response || response.status >= 400) {
    failedRequests.add(1);
  }
}

function testLoginFlow(user) {
  // Teste da página de login
  const loginPageResponse = http.get(`${BASE_URL}/login.html`);

  const pageLoaded = check(loginPageResponse, {
    'Login page loads': (r) => r && r.status === 200,
    'Login page has form': (r) => r && r.body && r.body.includes('loginForm'),
  });

  if (!pageLoaded) {
    failedRequests.add(1);
    authErrorsRate.add(1);
    console.error(`[VU ${__VU}] ❌ Falha ao carregar página de login`);
    return null;
  }

  sleep(1);

  // Teste do endpoint de login
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, loginParams);

  // Verifica se a resposta é válida
  if (!loginResponse) {
    authErrorsRate.add(1);
    failedRequests.add(1);
    loginSuccessRate.add(false);
    console.error(`[VU ${__VU}] ❌ Resposta de login nula para ${user.username}`);
    return null;
  }

  const loginSuccess = check(loginResponse, {
    'Login API status is 200': (r) => r.status === 200,
    'Login response time < 2s': (r) => r.timings && r.timings.duration < 2000,
    'Login returns username': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.username === user.username;
      } catch {
        return false;
      }
    },
    'Login sets session cookie': (r) => {
      const cookies = r.headers['Set-Cookie'];
      return cookies != null && cookies.toString().includes('sessionid=');
    },
  });

  loginSuccessRate.add(loginSuccess);
  
  if (loginResponse.timings) {
    apiResponseTime.add(loginResponse.timings.duration);
  }

  if (!loginSuccess) {
    authErrorsRate.add(1);
    failedRequests.add(1);
    console.error(`[VU ${__VU}] ❌ Falha no login para ${user.username}: Status ${loginResponse.status}`);
    return null;
  }

  // Captura os cookies usando K6 CookieJar (IGUAL ao teste-usuarios-simultaneos)
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(loginResponse.url);
  
  let sessionId = '';
  let userName = '';
  
  for (const [name, values] of Object.entries(cookies)) {
    if (name === 'sessionid' && values.length > 0) {
      sessionId = values[0];
    }
    if (name === 'name' && values.length > 0) {
      userName = values[0];
    }
  }
  
  // CORREÇÃO: Fallback para username se cookie 'name' não existir
  if (!userName) {
    try {
      const body = JSON.parse(loginResponse.body);
      userName = body.username || user.username;
    } catch (e) {
      userName = user.username;
    }
  }
  
  if (!sessionId) {
    authErrorsRate.add(1);
    console.error(`[VU ${__VU}] ❌ Cookie sessionId não encontrado para ${user.username}`);
    console.error(`   Cookies disponíveis: ${Object.keys(cookies).join(', ')}`);
    return null;
  }
  
  console.log(`[VU ${__VU}] 🔑 Cookies obtidos - sessionid: ${sessionId.substring(0, 8)}..., name: ${userName}`);
  
  return { sessionId, userName };
}

function testProblemsAPI(sessionData) {
  console.log(`[VU ${__VU}] 🔍 Testando APIs de problemas...`);
  
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const params = {
    headers: {
      'Cookie': cookieHeader,
    },
  };

  // Teste detalhes de problema específico
  const problemCode = problemCodes[Math.floor(Math.random() * problemCodes.length)];
  const problemResponse = http.get(`${API_URL}/problems/${problemCode}/details`, params);

  const problemSuccess = check(problemResponse, {
    'Problem details status is 200, 401 or 422': (r) => r && [200, 401, 422].includes(r.status),
    'Problem details response time < 2s': (r) => r && r.timings && r.timings.duration < 2000,
  });

  problemApiCalls.add(1);

  if (problemResponse && problemResponse.timings) {
    apiResponseTime.add(problemResponse.timings.duration);
  }

  if (problemResponse && problemResponse.status === 401) {
    authErrorsRate.add(1);
    console.error(`[VU ${__VU}] ⚠️ Erro 401 ao buscar problema ${problemCode}`);
  } else if (problemResponse && problemResponse.status >= 400 && problemResponse.status !== 422) {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] ❌ Erro ${problemResponse.status} ao buscar problema ${problemCode}`);
  } else if (problemSuccess) {
    console.log(`[VU ${__VU}] ✅ Problema ${problemCode} acessado com sucesso`);
  }
}

function testProblemsSearchAPI(sessionData) {
  console.log(`[VU ${__VU}] 🔍 Testando busca de problemas...`);
  
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const params = {
    headers: {
      'Cookie': cookieHeader,
    },
  };

  // Teste busca de problemas por chave
  const searchKey = searchKeys[Math.floor(Math.random() * searchKeys.length)];
  const searchResponse = http.get(`${API_URL}/problems/key/${searchKey}`, params);

  const searchSuccess = check(searchResponse, {
    'Search problems status is 200, 401 or 404': (r) => r && [200, 401, 404].includes(r.status),
    'Search problems response time < 1.5s': (r) => r && r.timings && r.timings.duration < 1500,
  });

  problemApiCalls.add(1);

  if (searchResponse && searchResponse.timings) {
    apiResponseTime.add(searchResponse.timings.duration);
  }

  if (searchResponse && searchResponse.status === 401) {
    authErrorsRate.add(1);
    console.error(`[VU ${__VU}] ⚠️ Erro 401 ao buscar por chave ${searchKey}`);
  } else if (searchResponse && searchResponse.status >= 400 && searchResponse.status !== 404) {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] ❌ Erro ${searchResponse.status} ao buscar por chave ${searchKey}`);
  } else if (searchSuccess) {
    console.log(`[VU ${__VU}] ✅ Busca por chave ${searchKey} executada com sucesso`);
  }
}

function testSolutionsAPI(sessionData) {
  console.log(`[VU ${__VU}] 💾 Testando APIs de soluções...`);
  
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const params = {
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
  };

  // Teste busca de detalhes da solução
  const solutionCode = solutionsCodes[Math.floor(Math.random() * solutionsCodes.length)];
  const solutionResponse = http.get(`${API_URL}/solutions/${solutionCode}/details`, params);

  const solutionSuccess = check(solutionResponse, {
    'Solution details status is 200, 401, 404 or 422': (r) => r && [200, 401, 404, 422].includes(r.status),
    'Solution details response time < 2s': (r) => r && r.timings && r.timings.duration < 2000,
  });

  solutionApiCalls.add(1);

  if (solutionResponse && solutionResponse.timings) {
    apiResponseTime.add(solutionResponse.timings.duration);
  }

  if (solutionResponse && solutionResponse.status === 401) {
    authErrorsRate.add(1);
    console.error(`[VU ${__VU}] ⚠️ Erro 401 ao buscar solução ${solutionCode}`);
  } else if (solutionResponse && solutionResponse.status >= 400 && ![404, 422].includes(solutionResponse.status)) {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] ❌ Erro ${solutionResponse.status} ao buscar solução ${solutionCode}`);
  } else if (solutionSuccess) {
    console.log(`[VU ${__VU}] ✅ Solução ${solutionCode} acessada com sucesso`);
  }
}

function testLogout(sessionData) {
  console.log(`[VU ${__VU}] 🚪 Realizando logout...`);
  
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const logoutPayload = JSON.stringify({
    username: sessionData.userName
  });

  const params = {
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
  };

  const logoutResponse = http.post(`${API_URL}/auth/logout`, logoutPayload, params);

  const logoutSuccess = check(logoutResponse, {
    'Logout status is 200 or 204': (r) => r && (r.status === 200 || r.status === 204),
    'Logout response time < 1s': (r) => r && r.timings && r.timings.duration < 1000,
  });

  if (logoutResponse && logoutResponse.timings) {
    apiResponseTime.add(logoutResponse.timings.duration);
  }

  if (!logoutSuccess) {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] ❌ Falha no logout: Status ${logoutResponse ? logoutResponse.status : 'N/A'}`);
  } else {
    console.log(`[VU ${__VU}] ✅ Logout realizado com sucesso`);
  }
}

// Função de setup (executada uma vez por VU)
export function setup() {
  console.log('🚀 Iniciando testes de carga da aplicação Web-Algo');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API URL: ${API_URL}`);
  
  // Verificar se a aplicação está respondendo
  const healthCheck = http.get(BASE_URL);
  if (healthCheck.status !== 200) {
    console.error('❌ Aplicação não está respondendo!');
  } else {
    console.log('✅ Aplicação está ativa');
  }
}

// Função de teardown (executada após todos os testes)
export function teardown(data) {
  console.log('✅ Testes de carga finalizados');
}