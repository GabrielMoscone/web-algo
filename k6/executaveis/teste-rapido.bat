@echo off
echo ====================================
echo Teste Rapido
echo ====================================
echo.

echo Verificando se containers estao rodando...
docker-compose ps

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
echo Executando teste funcional (5 minutos)...
docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste.js

echo.
echo ==================== RESULTADO ====================
echo Teste concluido! Acesse:
echo   - Grafana: http://localhost:3000 (admin/admin)
echo   - Prometheus: http://localhost:9090
echo.
pause