@echo off
echo ====================================
echo Teste Funcional
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-funcional.js

echo.
pause