
# WebAlgo - Arquitetura com Docker, NGINX e Middleware

Este projeto implementa uma aplicação completa utilizando uma arquitetura baseada em containers Docker. A aplicação é composta por três principais serviços:

- **Frontend:** Interface web estática (HTML, CSS, JS).
- **Middleware:** API desenvolvida em Java (Spring Boot).
- **NGINX:** Proxy reverso com balanceamento de carga entre múltiplas instâncias do middleware.

---

## 🚀 Arquitetura do Projeto

```
webalgo/
├── web-algo/             # Código do front-end (HTML, CSS, JS)
├── middleware/           # Código Java Spring Boot (API)
├── nginx/                # Configuração do NGINX (proxy reverso + load balancer)
├── docker-compose.yml    # Orquestração dos serviços Docker
```

---

## 🔗 Fluxo de Funcionamento

- O **frontend** roda na porta `3000` e serve os arquivos da interface web.
- As chamadas de API feitas pelo frontend são enviadas para o **NGINX** na porta `8088`.
- O **NGINX** atua como proxy reverso, redirecionando as requisições `/api/` para o **cluster de middleware**, que possui duas instâncias (`middleware1` e `middleware2`).
- As respostas são encaminhadas de volta para o frontend.

---

## ⚙️ Como rodar localmente com Docker

### 🐳 Pré-requisitos

- [Docker](https://www.docker.com/) instalado
- [Docker Compose](https://docs.docker.com/compose/) instalado

---

### 🚀 Executando o projeto

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
git checkout webalgo_docker
```

2. Suba os containers:

```bash
docker-compose up --build
```

3. Acesse no navegador:

- Frontend: http://localhost:3000
- API (via NGINX Proxy): http://localhost:8088/api

---

### 🛑 Para parar os containers:

```bash
docker-compose down
```

---

## ⚙️ Serviços e Portas

| Serviço     | Descrição                       | Porta Local |
|--------------|---------------------------------|-------------|
| Frontend     | Interface Web                   | 3000        |
| NGINX Proxy  | Proxy reverso + Load Balancer   | 8088        |
| Middleware 1 | API Spring Boot (Interno)       | 8080        |
| Middleware 2 | API Spring Boot (Interno)       | 8080        |

---

## 🔥 Funcionalidades do NGINX

- Atua como **proxy reverso** para a API.
- Faz **balanceamento de carga** entre `middleware1` e `middleware2` utilizando o método **round-robin**.
- Permite chamadas CORS para integração com o frontend.

---

## 📄 Documentação Técnica

- O middleware está localizado na pasta `/middleware`, desenvolvido em Java com Spring Boot.
- O frontend está na pasta `/web-algo`, utilizando HTML, CSS e JavaScript.
- As configurações do NGINX estão na pasta `/nginx` no arquivo `nginx.conf`.
- A orquestração dos serviços é feita via `docker-compose.yml` na raiz do projeto.

---
