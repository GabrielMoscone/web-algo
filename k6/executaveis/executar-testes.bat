@echo off
echo ====================================
echo Executar Todos os Testes
echo ====================================
echo.
echo Escolha o teste a executar:
echo 1 - Teste Basico
echo 2 - Teste de Balanceamento
echo 3 - Teste de Capacidade Maxima
echo 4 - Teste de Failover
echo 5 - Teste Funcional
echo 6 - Teste de Latencia
echo 7 - Teste de Logs
echo 8 - Teste de Metricas Nginx
echo 9 - Teste de Usuarios Simultaneos
echo 0 - Executar TODOS os testes
echo.
where k6 >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: k6 nao esta instalado ou nao esta no PATH
    echo.
    echo Instale o k6 com: winget install k6
    echo Ou baixe em: https://k6.io/docs/get-started/installation/
    echo.
    pause
    exit /b 1
)
set /p opcao="Digite a opcao: "

if "%opcao%"=="1" k6 run ..\testes\teste.js
if "%opcao%"=="2" k6 run ..\testes\teste-balanceamento.js
if "%opcao%"=="3" k6 run ..\testes\teste-capacidade-maxima.js
if "%opcao%"=="4" k6 run ..\testes\teste-failover.js
if "%opcao%"=="5" k6 run ..\testes\teste-funcional.js
if "%opcao%"=="6" k6 run ..\testes\teste-latencia.js
if "%opcao%"=="7" k6 run ..\testes\teste-logs.js
if "%opcao%"=="8" k6 run ..\testes\teste-metricas-nginx.js
if "%opcao%"=="9" k6 run ..\testes\teste-usuarios-simultaneos.js
if "%opcao%"=="0" (
    k6 run ..\testes\teste.js
    k6 run ..\testes\teste-balanceamento.js
    k6 run ..\testes\teste-capacidade-maxima.js
    k6 run ..\testes\teste-failover.js
    k6 run ..\testes\teste-funcional.js
    k6 run ..\testes\teste-latencia.js
    k6 run ..\testes\teste-logs.js
    k6 run ..\testes\teste-metricas-nginx.js
    k6 run ..\testes\teste-usuarios-simultaneos.js
)

echo.
pause