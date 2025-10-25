@echo off
chcp 65001 >nul
echo ==================================== 
echo Teste de Capacidade Maxima
echo ====================================
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-capacidade-maxima.js > "%cd%\saida_teste.txt" 2>&1

echo.
echo Log salvo em: %cd%\saida_teste.txt
pause
