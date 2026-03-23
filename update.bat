@echo off
echo ========================================
echo  Movidesk MCP - Atualizador
echo ========================================
echo.

set INSTALL_DIR=C:\Users\Administrador\movidesk-ai-mcp-main\movidesk-ai-mcp-main
set BASE_URL=https://raw.githubusercontent.com/lavsqueiroz/movidesk-ai-mcp/main

echo [1/3] Baixando arquivos atualizados do GitHub...
curl -L -f -o "%INSTALL_DIR%\src\mcp-server\mcp-queue-server.ts" "%BASE_URL%/src/mcp-server/mcp-queue-server.ts"
curl -L -f -o "%INSTALL_DIR%\src\services\MovideskClient.ts" "%BASE_URL%/src/services/MovideskClient.ts"
curl -L -f -o "%INSTALL_DIR%\src\services\ClaudeClient.ts" "%BASE_URL%/src/services/ClaudeClient.ts"
curl -L -f -o "%INSTALL_DIR%\src\services\TicketProcessor.ts" "%BASE_URL%/src/services/TicketProcessor.ts"
curl -L -f -o "%INSTALL_DIR%\package.json" "%BASE_URL%/package.json"
curl -L -f -o "%INSTALL_DIR%\tsconfig.json" "%BASE_URL%/tsconfig.json"

echo [2/3] Baixando prompts...
if not exist "%INSTALL_DIR%\prompts" mkdir "%INSTALL_DIR%\prompts"
curl -L -f -o "%INSTALL_DIR%\prompts\N1_SUPPORT_AGENT.md" "%BASE_URL%/prompts/N1_SUPPORT_AGENT.md"

echo [3/3] Fazendo build...
cd /d "%INSTALL_DIR%"
call npm run build
if errorlevel 1 (
    echo ERRO: Falha no build.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Atualizacao concluida com sucesso!
echo  Reinicie o Claude Desktop manualmente.
echo ========================================
pause
