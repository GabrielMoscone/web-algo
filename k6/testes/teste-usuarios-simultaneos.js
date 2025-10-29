import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ===== MÉTRICAS CUSTOMIZADAS =====
export let loginSuccessRate = new Rate('login_success_rate');
export let searchResponseTime = new Trend('search_response_time');
export let failedLogins = new Counter('failed_logins');
export let successfulSearches = new Counter('successful_searches');

// ===== CONFIGURAÇÃO =====
const BASE_URL = __ENV.BASE_URL || 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

export let options = {
  scenarios: {
    // Cenário 1: Usuários fazendo login simultaneamente
    multiple_logins: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },   // Ramping up para 10 usuários
        { duration: '2m', target: 25 },    // Mantém 25 usuários
        { duration: '1m', target: 50 },    // Pico de 50 usuários
        { duration: '2m', target: 50 },    // Mantém o pico
        { duration: '30s', target: 0 },    // Ramping down
      ],
      exec: 'loginScenario',
    },
    
    // Cenário 2: Usuários buscando soluções
    search_solutions: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 15 },    // Ramping up para 15 usuários
        { duration: '3m', target: 30 },    // Mantém 30 usuários
        { duration: '1m', target: 10 },    // Reduz para 10
        { duration: '1m', target: 0 },     // Para
      ],
      exec: 'searchScenario',
      startTime: '1m', // Inicia após 1 minuto
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'],      // 95% das requests < 2s
    http_req_failed: ['rate<0.1'],          // Taxa de erro < 10%
    login_success_rate: ['rate>0.8'],       // 80% de logins com sucesso
    search_response_time: ['p(90)<1500'],   // 90% das buscas < 1.5s
  },
};

// ===== DADOS DE TESTE =====
const USERS = [
  { username: 'fulano4', password: 'fulano4' },
  { username: 'fulano1', password: 'fulano1' },
  { username: 'fulanotest', password: 'fulanotest' },
  { username: 'user123', password: 'user123' },
  { username: 'user321', password: 'user321' },
];

const SEARCH_TERMS = [
  'S',
  'V',
  'C',
  'G',
  'I',
  'M',
  'F',
  'R'
];

const PROBLEM_CODES = ['S00000050', 'S00000100', 'S00000200', 'S00000300', 'S00000400'];
const SOLUTIONS_CODES = ['S001_S00000050', 'S002_S00000050', 'S003_S00000050', 'S004_S00000050', 'S005_S00000050'];

// ===== CENÁRIO 1: MULTIPLE LOGINS =====
export function loginScenario() {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  
  console.log(`👤 Usuário ${user.username} tentando fazer login...`);
  
  // 1. Acessar página de login
  let loginPageResponse = http.get(`${BASE_URL}/login.html`);
  check(loginPageResponse, {
    'Página de login carregou': (r) => r && r.status === 200,
    'Contém formulário de login': (r) => r && r.body && (r.body.includes('login') || r.body.includes('email')),
  });
  
  sleep(1); // Simula tempo de leitura da página
  
  // 2. Fazer login via API
  const loginPayload = {
    username: user.username,
    password: user.password
  };
  
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = loginResponse && check(loginResponse, {
    'Login status OK': (r) => r && (r.status === 200 || r.status === 201),
    'Login response tem dados': (r) => r && r.body && r.body.length > 0,
  });
  
  // Registrar métricas
  loginSuccessRate.add(loginSuccess);
  if (!loginSuccess) {
    failedLogins.add(1);
    console.log(`❌ Falha no login para ${user.username}: Status ${loginResponse ? loginResponse.status : 'N/A'}`);
  } else {
    console.log(`✅ Login bem-sucedido para ${user.username}`);
  }
  
  sleep(2); // Pausa entre requests
  
  // 3. Se login foi bem-sucedido, navegar na aplicação
  if (loginSuccess) {
    // Captura os cookies da resposta (sessionid e name)
    const jar = http.cookieJar();
    const cookies = jar.cookiesForURL(loginResponse.url);
    
    // Extrai os valores dos cookies
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
    
    console.log(`🔑 Cookies obtidos - sessionid: ${sessionId ? 'OK' : 'MISSING'}, name: ${userName ? userName : 'MISSING'}`);
    
    // Headers com cookies de sessão
    const headers = {};
    if (sessionId && userName) {
      headers['Cookie'] = `sessionid=${sessionId}; name=${userName}`;
    }
    
    // Acessar página principal
    let mainPageResponse = http.get(`${BASE_URL}/index.html`, {
      headers: headers,
    });
    check(mainPageResponse, {
      'Página principal carregou': (r) => r.status === 200,
    });
    
    sleep(1);
    
    // Fazer logout (50% das vezes)
    if (Math.random() < 0.5) {
      let logoutResponse = http.post(`${API_URL}/auth/logout`, JSON.stringify({username: user.username}), {
        headers: Object.assign({}, headers, {'Content-Type': 'application/json'}),
      });
      check(logoutResponse, {
        'Logout realizado': (r) => r.status === 200 || r.status === 204,
      });
      console.log(`🚪 Logout realizado para ${user.username}`);
    }
  }
  
  sleep(1);
}

// ===== CENÁRIO 2: SEARCH SOLUTIONS =====
export function searchScenario() {
  // Primeiro faz login para obter os cookies de sessão
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  
  console.log(`🔍 Iniciando busca para usuário: ${user.username}`);
  
  const loginPayload = {
    username: user.username,
    password: user.password
  };
  
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = loginResponse && loginResponse.status === 200;
  
  if (!loginSuccess) {
    console.log(`❌ Falha no login para busca - ${user.username}: Status ${loginResponse ? loginResponse.status : 'N/A'}`);
    return; // Não continua se o login falhar
  }
  
  console.log(`✅ Login bem-sucedido para busca - ${user.username}`);
  
  // Captura os cookies da resposta usando K6 CookieJar
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(loginResponse.url);
  
  // Extrai os valores dos cookies
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
  
  // CORREÇÃO: Se não encontrou o cookie 'name', tentar extrair do body da resposta
  if (!userName) {
    try {
      const body = JSON.parse(loginResponse.body);
      userName = body.username || user.username;
    } catch (e) {
      userName = user.username; // Fallback para o username original
    }
  }
  
  if (!sessionId) {
    console.log(`❌ Cookie sessionId não encontrado para ${user.username}`);
    console.log(`   Cookies disponíveis: ${Object.keys(cookies).join(', ')}`);
    return;
  }
  
  console.log(`🔑 Cookies obtidos para busca - sessionid: ${sessionId.substring(0, 8)}..., name: ${userName}`);
  
  sleep(1);
  
  const searchTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  const problemCode = PROBLEM_CODES[Math.floor(Math.random() * PROBLEM_CODES.length)];
  const solutionsCode = SOLUTIONS_CODES[Math.floor(Math.random() * SOLUTIONS_CODES.length)];
  
  console.log(`🔍 Buscando por: ${searchTerm} / ${problemCode} / ${solutionsCode}`);
  
  // Headers com ambos os cookies (sessionid e name)
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `sessionid=${sessionId}; name=${userName}`
  };
  
  // 1. Buscar problema por chave
  const searchStart = Date.now();
  let problemResponse = http.get(`${API_URL}/problems/key/${searchTerm}`, {
    headers: headers,
  });
  const searchDuration = Date.now() - searchStart;
  
  const searchSuccess = check(problemResponse, {
    'Busca de problema executada': (r) => r.status === 200 || r.status === 404,
    'Response time OK': (r) => r.timings.duration < 3000,
  });
  
  // Registrar métricas de busca
  searchResponseTime.add(searchDuration);
  if (searchSuccess && problemResponse.status === 200) {
    successfulSearches.add(1);
    console.log(`✅ Problema encontrado para: ${searchTerm}`);
  } else if (problemResponse.status === 401) {
    console.log(`⚠️ Busca de problema retornou 401 (não autorizado) para ${userName}`);
  } else if (problemResponse.status !== 200 && problemResponse.status !== 404) {
    console.log(`⚠️ Busca de problema retornou status ${problemResponse.status}`);
  }
  
  sleep(1);
  
  // 2. Buscar detalhes de solução
  let solutionResponse = http.get(`${API_URL}/solutions/${solutionsCode}/details`, {
    headers: headers,
  });
  
  const solutionCheck = check(solutionResponse, {
    'Busca de solução executada': (r) => r.status === 200 || r.status === 404,
    'Solution response válido': (r) => r.body.length > 0,
  });
  
  if (!solutionCheck) {
    console.log(`⚠️ Busca de solução retornou status ${solutionResponse.status}`);
  }
  
  sleep(1);
  
  // 3. Buscar detalhes do problema
  let problemDetailsResponse = http.get(`${API_URL}/problems/${problemCode}/details`, {
    headers: headers,
  });
  const detailsCheck = check(problemDetailsResponse, {
    'Detalhes do problema acessados': (r) => r.status === 200 || r.status === 404,
  });
  
  if (!detailsCheck) {
    console.log(`⚠️ Detalhes do problema retornou status ${problemDetailsResponse.status}`);
  }
  
  sleep(2); // Pausa entre buscas
  
  // ADIÇÃO: Fazer logout após as buscas
  const logoutPayload = JSON.stringify({ username: userName });
  const logoutResponse = http.post(`${API_URL}/auth/logout`, logoutPayload, {
    headers: Object.assign({}, headers, {'Content-Type': 'application/json'}),
  });
  
  check(logoutResponse, {
    'Logout realizado': (r) => r.status === 200 || r.status === 204,
  });
  
  console.log(`🚪 Logout realizado para ${userName}`);
}

// ===== SETUP =====
export function setup() {
  console.log('🚀 Iniciando teste de múltiplos usuários...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API URL: ${API_URL}`);
  console.log('👥 Cenários: Login simultâneo + Busca de soluções');
  
  // Verificar se a aplicação está respondendo
  let healthCheck = http.get(BASE_URL);
  if (healthCheck.status !== 200) {
    console.error('❌ Aplicação não está respondendo!');
  } else {
    console.log('✅ Aplicação está ativa');
  }
}