@echo off
echo ====================================
echo Teste de Balanceamento
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-balanceamento.js

echo.
pause
