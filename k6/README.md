# Testes K6 - Web-Algo

Este diretório contém testes de performance e carga usando K6 para o projeto Web-Algo.

## 📋 Pré-requisitos

- [K6](https://k6.io/docs/getting-started/installation/) instalado
- Servidores backend rodando (portas 5001, 5002, 5003)
- Nginx configurado como load balancer

## 🗂️ Estrutura do Projeto

```
k6/
├── executaveis/          # Scripts batch para executar os testes
├── testes/               # Scripts de teste K6
└── README.md            # Este arquivo
```

## 🧪 Tipos de Testes

### 1. Teste Funcional (`teste-funcional.js`)
Valida funcionalidades básicas da API.
```bash
cd executaveis
teste-funcional.bat
```

### 2. Teste de Balanceamento (`teste-balanceamento.js`)
Verifica distribuição de carga entre servidores.
```bash
cd executaveis
teste-balanceamento.bat
```

### 3. Teste de Latência (`teste-latencia.js`)
Mede tempos de resposta e performance.
```bash
cd executaveis
teste-latencia.bat
```

### 4. Teste de Usuários Simultâneos (`teste-usuarios-simultaneos.js`)
Simula múltiplos usuários concorrentes.
```bash
cd executaveis
teste-usuarios.bat
```

### 5. Teste de Capacidade Máxima (`teste-capacidade-maxima.js`)
Identifica limites do sistema sob carga extrema.
```bash
cd executaveis
teste-capacidade-maxima.bat
```

### 6. Teste de Failover (`teste-failover.js`)
Valida comportamento quando servidores falham.
```bash
cd executaveis
teste-failover.bat
```

### 7. Teste de Logs (`teste-logs.js`)
Verifica geração e consistência de logs.
```bash
cd executaveis
teste-logs.bat
```

### 8. Teste de Métricas Nginx (`teste-metricas-nginx.js`)
Valida métricas expostas pelo Nginx.
```bash
cd executaveis
teste-metricas-nginx.bat
```

### 9. Teste Rápido (`teste.js`)
Teste básico para validação rápida.
```bash
cd executaveis
teste-rapido.bat
```

## 🚀 Executando Todos os Testes

Para executar todos os testes de uma vez:

```bash
cd executaveis
executar-testes.bat
```

## 📊 Interpretando Resultados

Os testes K6 fornecem métricas como:

- **http_req_duration**: Tempo de resposta das requisições
- **http_req_failed**: Taxa de falhas
- **http_reqs**: Total de requisições
- **vus**: Usuários virtuais ativos
- **iterations**: Iterações completadas

### Thresholds Comuns

- ✅ `http_req_duration < 200ms` - Latência aceitável
- ✅ `http_req_failed < 1%` - Taxa de erro baixa
- ✅ `http_req_duration{p(95)} < 500ms` - 95% das requisições rápidas

## 📝 Exemplos de Execução Manual

Execute testes diretamente com K6:

```bash
# Teste funcional
k6 run testes/teste-funcional.js

# Teste com mais VUs
k6 run --vus 50 --duration 30s testes/teste-usuarios-simultaneos.js

# Teste com output JSON
k6 run --out json=results.json testes/teste-latencia.js
```

## 🐛 Troubleshooting

### Erro "Connection Refused"
- Verifique se os servidores backend estão rodando
- Confirme as portas configuradas

### Teste Falha Imediatamente
- Valide thresholds nos scripts
- Verifique logs dos servidores

### Alta Taxa de Erros
- Reduza número de VUs
- Aumente recursos do servidor
- Verifique configurações de timeout

## 📚 Documentação K6

- [Documentação Oficial](https://k6.io/docs/)
- [Tipos de Testes](https://k6.io/docs/test-types/introduction/)
- [Métricas](https://k6.io/docs/using-k6/metrics/)
- [Thresholds](https://k6.io/docs/using-k6/thresholds/)

## 🤝 Contribuindo

Ao adicionar novos testes:

1. Crie o script em `testes/`
2. Adicione arquivo `.bat` correspondente em `executaveis/`
3. Atualize este README com descrição do teste
4. Use thresholds apropriados
5. Documente parâmetros configuráveis

---

**Última atualização**: Outubro 2025