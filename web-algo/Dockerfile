FROM nginx:alpine

# Copiar arquivos HTML (contexto será a raiz do projeto)
COPY index.html /usr/share/nginx/html/
COPY login.html /usr/share/nginx/html/
COPY cadastro.html /usr/share/nginx/html/
COPY recuperar-senha.html /usr/share/nginx/html/
COPY includes/ /usr/share/nginx/html/includes/
COPY assets/ /usr/share/nginx/html/assets/

# Expor porta
EXPOSE 80