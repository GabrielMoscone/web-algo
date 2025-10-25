@echo off
echo ====================================
echo Teste de Metricas do Nginx
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-metricas-nginx.js

echo.
pause