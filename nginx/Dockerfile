FROM nginx:alpine

# Config do NGINX
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Arquivos estáticos
COPY web-algo/index.html /usr/share/nginx/html/index.html
COPY web-algo/login.html /usr/share/nginx/html/login.html
COPY web-algo/cadastro.html /usr/share/nginx/html/cadastro.html
COPY web-algo/media/ /usr/share/nginx/html/media/

EXPOSE 80
