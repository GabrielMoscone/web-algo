@echo off
echo ====================================
echo Teste de Latencia
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-latencia.js

echo.
pause