@echo off
echo ==================================== 
echo Teste de Capacidade Maxima
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-capacidade-maxima.js

echo.
pause
