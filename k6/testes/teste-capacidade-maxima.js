import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

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
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },    // Aquecimento gradual - 50 VUs
                { duration: '2m', target: 50 },    // Mantém 50 VUs
                { duration: '2m', target: 100 },   // Aumenta para 100 VUs
                { duration: '2m', target: 100 },   // Mantém 100 VUs
                { duration: '2m', target: 150 },   // Aumenta para 150 VUs
                { duration: '2m', target: 150 },   // Mantém 150 VUs
                { duration: '2m', target: 200 },   // Aumenta para 200 VUs
                { duration: '2m', target: 200 },   // Mantém 200 VUs
                { duration: '2m', target: 250 },   // Aumenta para 250 VUs
                { duration: '2m', target: 250 },   // Mantém 250 VUs
                { duration: '2m', target: 300 },   // Aumenta para 300 VUs
                { duration: '2m', target: 300 },   // Mantém 300 VUs
                { duration: '2m', target: 350 },   // Aumenta para 350 VUs
                { duration: '2m', target: 350 },   // Mantém 350 VUs
                { duration: '2m', target: 400 },   // Aumenta para 400 VUs
                { duration: '2m', target: 400 },   // Mantém 400 VUs
                { duration: '2m', target: 450 },   // Aumenta para 450 VUs
                { duration: '2m', target: 450 },   // Mantém 450 VUs
                { duration: '2m', target: 500 },   // Aumenta para 500 VUs
                { duration: '2m', target: 500 },   // Mantém 500 VUs
                { duration: '3m', target: 0 },     // Ramp-down gradual
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed': ['rate<0.15'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

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
    console.log('📊 Fases do teste (aumento gradual):');
    console.log('   1. 0 → 50 VUs (2min) + Mantém 50 VUs (2min)');
    console.log('   2. 50 → 100 VUs (2min) + Mantém 100 VUs (2min)');
    console.log('   3. 100 → 150 VUs (2min) + Mantém 150 VUs (2min)');
    console.log('   4. 150 → 200 VUs (2min) + Mantém 200 VUs (2min)');
    console.log('   5. 200 → 250 VUs (2min) + Mantém 250 VUs (2min)');
    console.log('   6. 250 → 300 VUs (2min) + Mantém 300 VUs (2min)');
    console.log('   7. 300 → 350 VUs (2min) + Mantém 350 VUs (2min)');
    console.log('   8. 350 → 400 VUs (2min) + Mantém 400 VUs (2min)');
    console.log('   9. 400 → 450 VUs (2min) + Mantém 450 VUs (2min)');
    console.log('   10. 450 → 500 VUs (2min) + Mantém 500 VUs (2min)');
    console.log('   11. Ramp-down gradual (3min)');
    console.log('\n⏱️  Duração total: ~43 minutos\n');
    console.log('💡 Dica: Monitore em tempo real no Grafana');
    console.log('   http://localhost:3000\n');
    console.log('🎯 Objetivo: Identificar o ponto exato onde o sistema');
    console.log('   começa a apresentar degradação de performance.\n');
    
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
        sleep(0.1);
        return; // Continua o teste, apenas pula para próxima iteração
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
        sleep(0.1);
        return; // Continua o teste, apenas pula para próxima iteração
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
    const p99Duration = data.metrics.http_req_duration?.values['p(99)'] || 0;
    const maxVUs = data.metrics.vus_max?.values.max || 0;
    const testDurationMin = (data.state.testRunDurationMs / 60000).toFixed(2);

    // Métricas específicas
    const avgLogin = data.metrics.login_duration?.values.avg || 0;
    const avgSearch = data.metrics.search_duration?.values.avg || 0;
    const avgProblemDetails = data.metrics.problem_details_duration?.values.avg || 0;
    const avgSolutionDetails = data.metrics.solution_details_duration?.values.avg || 0;
    const avgLogout = data.metrics.logout_duration?.values.avg || 0;
    
    const totalProblemCalls = data.metrics.problem_api_calls?.values.count || 0;
    const totalSolutionCalls = data.metrics.solution_api_calls?.values.count || 0;

    // Análise de degradação por faixa de VUs
    console.log('\n========================================================');
    console.log('           RESUMO DO TESTE DE CAPACIDADE');
    console.log('========================================================\n');
    console.log(`⏱️  Duração do Teste: ${testDurationMin} minutos`);
    console.log(`📊 Requisições Totais: ${requests}`);
    console.log(`✅ Sucessos: ${requests - errors}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📈 Taxa de Erro: ${errorRate.toFixed(2)}%`);
    console.log(`👥 VUs Máximos Atingidos: ${maxVUs}`);
    
    console.log('\n📊 DURAÇÃO MÉDIA POR OPERAÇÃO:');
    console.log(`   🔐 Login: ${avgLogin.toFixed(2)}ms`);
    console.log(`   🔍 Busca por chave: ${avgSearch.toFixed(2)}ms`);
    console.log(`   📝 Detalhes problema: ${avgProblemDetails.toFixed(2)}ms`);
    console.log(`   💾 Detalhes solução: ${avgSolutionDetails.toFixed(2)}ms`);
    console.log(`   🚪 Logout: ${avgLogout.toFixed(2)}ms`);
    console.log(`   📊 Média Geral: ${avgDuration.toFixed(2)}ms`);
    console.log(`   📈 P95: ${p95Duration.toFixed(2)}ms`);
    console.log(`   🔝 P99: ${p99Duration.toFixed(2)}ms`);
    
    console.log('\n📈 CHAMADAS POR API:');
    console.log(`   🔍 APIs de Problemas: ${totalProblemCalls}`);
    console.log(`   💾 APIs de Soluções: ${totalSolutionCalls}`);
    
    // Análise de ponto de ruptura
    console.log('\n🎯 ANÁLISE DE CAPACIDADE:');
    
    if (errorRate < 5) {
        console.log(`   ✅ Sistema estável em ${maxVUs} VUs`);
        console.log(`   📊 Taxa de erro baixa (${errorRate.toFixed(2)}%)`);
        console.log(`   💡 Sistema pode suportar mais carga`);
    } else if (errorRate < 15) {
        console.log(`   ⚠️  Sistema começando a degradar em ${maxVUs} VUs`);
        console.log(`   📊 Taxa de erro moderada (${errorRate.toFixed(2)}%)`);
        console.log(`   💡 Próximo ao limite de capacidade`);
    } else {
        console.log(`   ❌ Sistema sobrecarregado em ${maxVUs} VUs`);
        console.log(`   📊 Taxa de erro alta (${errorRate.toFixed(2)}%)`);
        console.log(`   💡 Limite de capacidade ultrapassado`);
    }
    
    if (p95Duration > 2000) {
        console.log(`\n⚠️  P95 acima do threshold (${p95Duration.toFixed(2)}ms > 2000ms)`);
        console.log(`   Considere escalar horizontalmente ou otimizar queries`);
    }
    
    if (requests > 0) {
        const successfulRequests = requests - errors;
        const estimatedRPS = successfulRequests / (data.state.testRunDurationMs / 1000);
        const estimatedFlowsPS = estimatedRPS / 5;
        
        console.log(`\n💪 CAPACIDADE MEDIDA:`);
        console.log(`   ~${estimatedRPS.toFixed(2)} req/s bem-sucedidas`);
        console.log(`   ~${estimatedFlowsPS.toFixed(2)} fluxos completos/s`);
        console.log(`   ~${(estimatedFlowsPS * 60).toFixed(0)} fluxos/minuto`);
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
