import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

// Métricas customizadas
const loginDuration = new Trend('login_duration');
const searchDuration = new Trend('search_duration');
const problemDuration = new Trend('problem_duration');
const problemDetailsDuration = new Trend('problem_details_duration');
const solutionDetailsDuration = new Trend('solution_details_duration');
const logoutDuration = new Trend('logout_duration');
const failureRate = new Rate('failure_rate');
const errorCounter = new Counter('errors');
const problemApiCalls = new Counter('problem_api_calls');
const solutionApiCalls = new Counter('solution_api_calls');

// ===== CONFIGURAÇÃO =====
const BASE_URL = __ENV.BASE_URL || 'http://nginx:80';
const API_URL = `${BASE_URL}/api/v1/web-algo`;

// Dados de teste compartilhados
const USERS = new SharedArray('users', function () {
  return [
    { username: 'fulano4', password: 'fulano4' },
    { username: 'fulano1', password: 'fulano1' },
    { username: 'fulanotest', password: 'fulanotest' },
    { username: 'user123', password: 'user123' },
    { username: 'user321', password: 'user321' },
  ];
});

const PROBLEM_CODES = new SharedArray('problemCodes', function () {
  return ['S00000050', 'S00000100', 'S00000200', 'S00000300', 'S00000400'];
});

const SOLUTION_CODES = new SharedArray('solutionCodes', function () {
  return ['S001_S00000050', 'S002_S00000050', 'S003_S00000050', 'S004_S00000050', 'S005_S00000050'];
});

const SEARCH_KEYS = new SharedArray('searchKeys', function () {
  return ['S', 'V', 'C', 'G', 'I', 'M', 'F', 'R'];
});

// Configuração
export const options = {
    scenarios: {
        stress_test: {
            executor: 'ramping-arrival-rate',
            startRate: 50,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 500,
            stages: [
                { duration: '2m', target: 50 },   // Aquecimento
                { duration: '3m', target: 100 },  // Aumento gradual
                { duration: '3m', target: 200 },  // Continuando
                { duration: '3m', target: 300 },  // Próximo do limite
                { duration: '3m', target: 400 },  // Além do limite esperado
                { duration: '2m', target: 0 },    // Ramp-down
            ],
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed': ['rate<0.15'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Variáveis para controle de erro
let errorWindowStart = Date.now();
let errorsInWindow = 0;
const ERROR_WINDOW_MS = 5000;
const MAX_ERRORS_IN_WINDOW = 100;

export function setup() {
    console.log('\n========================================================');
    console.log('        TESTE DE CAPACIDADE MÁXIMA DO SISTEMA');
    console.log('========================================================\n');
    console.log('Este teste simula um fluxo completo de usuário:');
    console.log('   1. Login');
    console.log('   2. Busca de problemas por chave');
    console.log('   3. Consulta de detalhes de problema');
    console.log('   4. Consulta de detalhes de solução');
    console.log('   5. Logout\n');
    console.log('📊 Fases do teste:');
    console.log('   1. 50 req/s por 2 minutos');
    console.log('   2. 100 req/s por 3 minutos');
    console.log('   3. 200 req/s por 3 minutos');
    console.log('   4. 300 req/s por 3 minutos');
    console.log('   5. 400 req/s por 3 minutos');
    console.log('   6. Ramp-down por 2 minutos');
    console.log('\n⏱️  Duração total: ~16 minutos\n');
    console.log('⚠️  O teste PARARÁ automaticamente ao detectar:');
    console.log(`   - Mais de ${MAX_ERRORS_IN_WINDOW} erros críticos em ${ERROR_WINDOW_MS/1000} segundos`);
    console.log('   - Taxa de erro sustentada acima de 15%');
    console.log('\n💡 Dica: Monitore em tempo real no Grafana');
    console.log('   http://localhost:3000\n');
    
    // Teste de conectividade
    console.log('🔍 Testando conectividade com a API...');
    const testUser = USERS[0];
    const testPayload = JSON.stringify({
        username: testUser.username,
        password: testUser.password
    });
    
    const testParams = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '10s',
    };
    
    const testResponse = http.post(`${API_URL}/auth/login`, testPayload, testParams);
    console.log(`   Status: ${testResponse.status}`);
    
    if (testResponse.status !== 200 && testResponse.status !== 201) {
        console.log(`   Resposta: ${testResponse.body}`);
        console.log('\n⚠️  ATENÇÃO: API não está respondendo corretamente!');
    } else {
        console.log('   ✅ Conectividade OK!\n');
    }
    
    console.log('Iniciando teste...\n');
    console.log('========================================================\n');
}

export default function () {
    const now = Date.now();
    
    // Reset da janela de erros
    if (now - errorWindowStart > ERROR_WINDOW_MS) {
        if (errorsInWindow > MAX_ERRORS_IN_WINDOW) {
            console.log(`\n🛑 TESTE INTERROMPIDO: ${errorsInWindow} erros críticos em ${ERROR_WINDOW_MS/1000}s!`);
            console.log(`⏱️  Tempo de execução até falha: ${Math.floor((now - errorWindowStart) / 1000)}s`);
            exec.test.abort('Taxa de erro crítica detectada');
            return;
        }
        errorsInWindow = 0;
        errorWindowStart = now;
    }

    // Seleciona um usuário aleatório
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    
    // === 1. LOGIN ===
    const loginPayload = JSON.stringify({
        username: user.username,
        password: user.password
    });

    const loginParams = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '30s',
    };

    const startLogin = new Date().getTime();
    const loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, loginParams);
    const loginDur = new Date().getTime() - startLogin;
    loginDuration.add(loginDur);

    const loginSuccess = check(loginResponse, {
        'login: status is 200': (r) => r.status === 200,
        'login: has username': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.username === user.username;
            } catch {
                return false;
            }
        },
    });

    if (!loginSuccess) {
        errorCounter.add(1);
        failureRate.add(1);
        if (loginResponse.status === 0 || loginResponse.status >= 500) {
            errorsInWindow++;
        }
        sleep(0.1);
        return;
    }

    // Captura os cookies usando K6 CookieJar
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
    
    // Fallback para username se cookie 'name' não existir
    if (!userName) {
        try {
            const body = JSON.parse(loginResponse.body);
            userName = body.username || user.username;
        } catch (e) {
            userName = user.username;
        }
    }
    
    if (!sessionId) {
        errorCounter.add(1);
        failureRate.add(1);
        errorsInWindow++;
        sleep(0.1);
        return;
    }

    const cookieHeader = `sessionid=${sessionId}; name=${userName}`;

    sleep(0.1); // Simula tempo de "pensar" do usuário

    // === 2. BUSCA DE PROBLEMAS POR CHAVE ===
    const searchKey = SEARCH_KEYS[Math.floor(Math.random() * SEARCH_KEYS.length)];
    const searchParams = {
        headers: {
            'Cookie': cookieHeader,
        },
        timeout: '30s',
    };

    const startSearch = new Date().getTime();
    const searchResponse = http.get(`${API_URL}/problems/key/${searchKey}`, searchParams);
    const searchDur = new Date().getTime() - startSearch;
    searchDuration.add(searchDur);

    const searchSuccess = check(searchResponse, {
        'search: status is 200, 401 or 404': (r) => [200, 401, 404].includes(r.status),
        'search: response time < 1.5s': (r) => r.timings && r.timings.duration < 1500,
    });

    problemApiCalls.add(1);

    if (!searchSuccess) {
        errorCounter.add(1);
        failureRate.add(1);
        if (searchResponse.status === 0 || searchResponse.status >= 500) {
            errorsInWindow++;
        }
    }

    sleep(0.2); // Simula tempo de "pensar" do usuário

    // === 3. CONSULTA DE DETALHES DE PROBLEMA ===
    const problemCode = PROBLEM_CODES[Math.floor(Math.random() * PROBLEM_CODES.length)];
    const problemParams = {
        headers: {
            'Cookie': cookieHeader,
        },
        timeout: '30s',
    };

    const startProblem = new Date().getTime();
    const problemResponse = http.get(`${API_URL}/problems/${problemCode}/details`, problemParams);
    const problemDur = new Date().getTime() - startProblem;
    problemDetailsDuration.add(problemDur);

    const problemSuccess = check(problemResponse, {
        'problem details: status is 200, 401 or 422': (r) => [200, 401, 422].includes(r.status),
        'problem details: response time < 2s': (r) => r.timings && r.timings.duration < 2000,
    });

    problemApiCalls.add(1);

    if (!problemSuccess) {
        errorCounter.add(1);
        failureRate.add(1);
        if (problemResponse.status === 0 || problemResponse.status >= 500) {
            errorsInWindow++;
        }
    }

    sleep(0.2);

    // === 4. CONSULTA DE DETALHES DE SOLUÇÃO ===
    const solutionCode = SOLUTION_CODES[Math.floor(Math.random() * SOLUTION_CODES.length)];
    const solutionParams = {
        headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json',
        },
        timeout: '30s',
    };

    const startSolution = new Date().getTime();
    const solutionResponse = http.get(`${API_URL}/solutions/${solutionCode}/details`, solutionParams);
    const solutionDur = new Date().getTime() - startSolution;
    solutionDetailsDuration.add(solutionDur);

    const solutionSuccess = check(solutionResponse, {
        'solution details: status is 200, 401, 404 or 422': (r) => [200, 401, 404, 422].includes(r.status),
        'solution details: response time < 2s': (r) => r.timings && r.timings.duration < 2000,
    });

    solutionApiCalls.add(1);

    if (!solutionSuccess) {
        errorCounter.add(1);
        failureRate.add(1);
        if (solutionResponse.status === 0 || solutionResponse.status >= 500) {
            errorsInWindow++;
        }
    }

    sleep(0.2);

    // === 5. LOGOUT ===
    const logoutPayload = JSON.stringify({
        username: userName
    });

    const logoutParams = {
        headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json',
        },
        timeout: '30s',
    };

    const startLogout = new Date().getTime();
    const logoutResponse = http.post(`${API_URL}/auth/logout`, logoutPayload, logoutParams);
    const logoutDur = new Date().getTime() - startLogout;
    logoutDuration.add(logoutDur);

    const logoutSuccess = check(logoutResponse, {
        'logout: status is 200 or 204': (r) => r.status === 200 || r.status === 204,
        'logout: response time < 1s': (r) => r.timings && r.timings.duration < 1000,
    });

    if (!logoutSuccess) {
        errorCounter.add(1);
        failureRate.add(1);
        if (logoutResponse.status === 0 || logoutResponse.status >= 500) {
            errorsInWindow++;
        }
    } else {
        failureRate.add(0);
    }

    sleep(0.1);
}

export function handleSummary(data) {
    const errors = data.metrics.errors?.values.count || 0;
    const requests = data.metrics.http_reqs?.values.count || 0;
    const errorRate = requests > 0 ? (errors / requests * 100) : 0;
    const avgDuration = data.metrics.http_req_duration?.values.avg || 0;
    const p95Duration = data.metrics.http_req_duration?.values['p(95)'] || 0;
    const maxVUs = data.metrics.vus_max?.values.max || 0;
    const testDurationSec = (data.state.testRunDurationMs / 1000).toFixed(2);

    // Métricas específicas
    const avgLogin = data.metrics.login_duration?.values.avg || 0;
    const avgSearch = data.metrics.search_duration?.values.avg || 0;
    const avgProblemDetails = data.metrics.problem_details_duration?.values.avg || 0;
    const avgSolutionDetails = data.metrics.solution_details_duration?.values.avg || 0;
    const avgLogout = data.metrics.logout_duration?.values.avg || 0;
    
    const totalProblemCalls = data.metrics.problem_api_calls?.values.count || 0;
    const totalSolutionCalls = data.metrics.solution_api_calls?.values.count || 0;

    console.log('\n========================================================');
    console.log('           RESUMO DO TESTE DE CAPACIDADE');
    console.log('========================================================\n');
    console.log(`⏱️  Duração do Teste: ${testDurationSec}s`);
    console.log(`📊 Requisições Totais: ${requests}`);
    console.log(`✅ Sucessos: ${requests - errors}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📈 Taxa de Erro: ${errorRate.toFixed(2)}%`);
    console.log(`👥 VUs Máximos: ${maxVUs}`);
    
    console.log('\n📊 DURAÇÃO MÉDIA POR OPERAÇÃO:');
    console.log(`   🔐 Login: ${avgLogin.toFixed(2)}ms`);
    console.log(`   🔍 Busca por chave: ${avgSearch.toFixed(2)}ms`);
    console.log(`   📝 Detalhes problema: ${avgProblemDetails.toFixed(2)}ms`);
    console.log(`   💾 Detalhes solução: ${avgSolutionDetails.toFixed(2)}ms`);
    console.log(`   🚪 Logout: ${avgLogout.toFixed(2)}ms`);
    console.log(`   📊 Geral: ${avgDuration.toFixed(2)}ms`);
    console.log(`   📈 P95: ${p95Duration.toFixed(2)}ms`);
    
    console.log('\n📈 CHAMADAS POR API:');
    console.log(`   🔍 APIs de Problemas: ${totalProblemCalls}`);
    console.log(`   💾 APIs de Soluções: ${totalSolutionCalls}`);
    
    if (requests > 0) {
        const successfulRequests = requests - errors;
        const estimatedCapacity = successfulRequests / (data.state.testRunDurationMs / 1000);
        console.log(`\n🎯 CAPACIDADE ESTIMADA DO SISTEMA:`);
        console.log(`   ~${estimatedCapacity.toFixed(2)} requisições bem-sucedidas/segundo`);
        console.log(`   ~${(estimatedCapacity / 5).toFixed(2)} fluxos completos/segundo`);
        
        if (errorRate > 10) {
            console.log(`\n⚠️  ATENÇÃO: Taxa de erro de ${errorRate.toFixed(2)}% indica que o sistema`);
            console.log(`   atingiu seu limite de capacidade.`);
        }
    }
    
    console.log('\n========================================================\n');

    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}

export function teardown(data) {
    console.log('\n✅ Teste de capacidade finalizado!');
    console.log('📊 Verifique o Grafana para análise detalhada dos resultados.\n');
}
