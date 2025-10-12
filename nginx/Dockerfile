# nginx/Dockerfile
FROM nginx:1.27-alpine

# Substitui o nginx.conf padrão
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copia páginas HTML e assets do frontend
COPY web-algo/login.html    /usr/share/nginx/html/login.html
COPY web-algo/index.html    /usr/share/nginx/html/index.html
COPY web-algo/cadastro.html /usr/share/nginx/html/cadastro.html
COPY web-algo/includes/     /usr/share/nginx/html/includes/
COPY web-algo/media/        /usr/share/nginx/html/media/

EXPOSE 80
