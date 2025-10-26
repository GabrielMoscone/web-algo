@echo off
chcp 65001 >nul
echo ====================================
echo Teste de Carga Completo + Spike
echo ====================================
echo.

echo Verificando se containers estao rodando...
docker-compose ps

echo.
echo Executando teste de carga (10-100 usuarios) + spike (200 usuarios)...
echo Duracao estimada: 24 minutos
echo Log sera salvo em: %cd%\saida_teste_completo.txt
echo.

docker run --rm -i --network web-algo_default ^
  -v "%cd%\..\testes:/scripts" ^
  grafana/k6 run /scripts/teste-completo-e-spike.js > "%cd%\saida_teste_completo.txt" 2>&1

echo.
echo ==================== RESULTADO ====================
if %errorlevel% equ 0 (
    echo Teste concluido com sucesso!
) else (
    echo Teste finalizado com erros. Verifique o log.
)
echo.
echo Log salvo em: %cd%\saida_teste_completo.txt
echo.
echo Acesse:
echo   - Grafana: http://localhost:3000 (admin/admin)
echo   - Prometheus: http://localhost:9090
echo.
pause