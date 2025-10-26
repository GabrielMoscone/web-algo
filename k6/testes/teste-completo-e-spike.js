import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
export const loginSuccessRate = new Rate('login_success_rate');
export const apiResponseTime = new Trend('api_response_time');
export const failedRequests = new Counter('failed_requests');
export const authErrorsRate = new Rate('auth_errors_rate');

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
  // Configurações HTTP para melhor tratamento de erros
  httpDebug: 'error', // Mostra apenas erros HTTP
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

// Configurações da aplicação
const BASE_URL = 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  // Cenário de teste completo
  testHomePage();
  const sessionData = testLoginFlow(user);
  
  if (sessionData && sessionData.sessionId && sessionData.userName) {
    testProblemsAPI(sessionData);
    testSolutionsAPI(sessionData);
    testLogout(sessionData);
  }

  sleep(Math.random() * 3 + 1); // Sleep aleatório entre 1-4s
}

function testHomePage() {
  const response = http.get(BASE_URL);

  check(response, {
    'Home page status is 200 or 302': (r) => r && [200, 302].includes(r.status),
    'Home page response time < 1s': (r) => r && r.timings && r.timings.duration < 1000,
  });

  if (!check(response, { 'Home page loads': (r) => r && r.status < 400 })) {
    failedRequests.add(1);
  }
}

function testLoginFlow(user) {
  // Teste da página de login
  const loginPageResponse = http.get(`${BASE_URL}/login.html`);

  check(loginPageResponse, {
    'Login page loads': (r) => r && r.status === 200,
    'Login page has form': (r) => r && r.body && r.body.includes('loginForm'),
  });

  // Se a página de login não carregar, retornar null
  if (!loginPageResponse || loginPageResponse.status >= 400) {
    failedRequests.add(1);
    authErrorsRate.add(1);
    return null;
  }

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
    return null;
  }

  const loginSuccess = check(loginResponse, {
    'Login API status is 200': (r) => r && r.status === 200,
    'Login response time < 2s': (r) => r && r.timings && r.timings.duration < 2000,
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
  apiResponseTime.add(loginResponse.timings.duration);

  if (!loginSuccess) {
    authErrorsRate.add(1);
    failedRequests.add(1);
    return null;
  }

  // Captura os cookies da resposta usando a API do K6
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
  
  if (!sessionId || !userName) {
    authErrorsRate.add(1);
    return null;
  }
  
  return { sessionId, userName };
}

function testProblemsAPI(sessionData) {
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const params = {
    headers: {
      'Cookie': cookieHeader,
    },
  };

  // Teste busca de problemas por chave
  const searchResponse = http.get(`${API_URL}/problems/key/S`, params);

  check(searchResponse, {
    'Search problems status is 200 or 401': (r) => [200, 401].includes(r.status),
    'Search problems response time < 1.5s': (r) => r.timings.duration < 1500,
  });

  if (searchResponse.status === 401) {
    authErrorsRate.add(1);
    return;
  }

  // Teste detalhes de problema específico
  const problemCode = problemCodes[Math.floor(Math.random() * problemCodes.length)];
  const problemResponse = http.get(`${API_URL}/problems/${problemCode}/details`, params);

  check(problemResponse, {
    'Problem details status is 200, 401 or 422': (r) => [200, 401, 422].includes(r.status),
    'Problem details response time < 2s': (r) => r.timings.duration < 2000,
  });

  apiResponseTime.add(problemResponse.timings.duration);

  if (problemResponse.status === 401) {
    authErrorsRate.add(1);
  } else if (problemResponse.status >= 400) {
    failedRequests.add(1);
  }
}

function testSolutionsAPI(sessionData) {
  const cookieHeader = `sessionid=${sessionData.sessionId}; name=${sessionData.userName}`;
  const params = {
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
  };

  // Teste criação de solução
  const problemCode = problemCodes[Math.floor(Math.random() * problemCodes.length)];
  const createSolutionPayload = JSON.stringify({
    problemCode: problemCode
  });

  const createResponse = http.post(`${API_URL}/solutions`, createSolutionPayload, params);

  check(createResponse, {
    'Create solution status is 200, 401 or 422': (r) => [200, 401, 422].includes(r.status),
    'Create solution response time < 3s': (r) => r.timings.duration < 3000,
  });

  apiResponseTime.add(createResponse.timings.duration);

  if (createResponse.status === 401) {
    authErrorsRate.add(1);
    return;
  } else if (createResponse.status >= 400) {
    failedRequests.add(1);
  }

  // Teste busca de detalhes da solução
  const solutionCode = solutionsCodes[Math.floor(Math.random() * solutionsCodes.length)];
  const solutionResponse = http.get(`${API_URL}/solutions/${solutionCode}/details`, params);

  check(solutionResponse, {
    'Solution details status is 200, 401 or 422': (r) => [200, 401, 422].includes(r.status),
    'Solution details response time < 2s': (r) => r.timings.duration < 2000,
  });

  apiResponseTime.add(solutionResponse.timings.duration);

  if (solutionResponse.status === 401) {
    authErrorsRate.add(1);
  } else if (solutionResponse.status >= 400) {
    failedRequests.add(1);
  }

  // Teste salvamento de solução
  const saveSolutionPayload = JSON.stringify({
    problemCode: problemCode,
    sourceCode: '#include <stdio.h>\nint main() {\n    printf("Hello World!");\n    return 0;\n}',
    language: 'C'
  });

  const saveResponse = http.post(`${API_URL}/solutions/save`, saveSolutionPayload, params);

  check(saveResponse, {
    'Save solution status is 200, 401 or 422': (r) => [200, 401, 422].includes(r.status),
    'Save solution response time < 3s': (r) => r.timings.duration < 3000,
  });

  apiResponseTime.add(saveResponse.timings.duration);

  if (saveResponse.status === 401) {
    authErrorsRate.add(1);
  } else if (saveResponse.status >= 400) {
    failedRequests.add(1);
  }
}

function testLogout(sessionData) {
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

  check(logoutResponse, {
    'Logout status is 200': (r) => r.status === 200,
    'Logout response time < 1s': (r) => r.timings.duration < 1000,
    'Logout clears session': (r) => {
      const cookies = r.headers['Set-Cookie'];
      return cookies != null && cookies.toString().includes('sessionid=;');
    },
  });

  apiResponseTime.add(logoutResponse.timings.duration);

  if (logoutResponse.status >= 400) {
    failedRequests.add(1);
  }
}

// Função de setup (executada uma vez por VU)
export function setup() {
  console.log('Iniciando testes de carga da aplicação Web-Algo');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
}

// Função de teardown (executada após todos os testes)
export function teardown(data) {
  console.log('Testes de carga finalizados');
}