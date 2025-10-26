@echo off
echo ====================================
echo Teste de Usuarios
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-usuarios-simultaneos.js

echo.
pause