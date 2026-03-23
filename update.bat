@echo off
echo ========================================
echo  Movidesk MCP - Atualizador
echo ========================================
echo.

set INSTALL_DIR=%~dp0
set ZIP_URL=https://github.com/lavsqueiroz/movidesk-ai-mcp/archive/refs/heads/main.zip
set ZIP_FILE=%TEMP%\movidesk-mcp-update.zip
set EXTRACT_DIR=%TEMP%\movidesk-mcp-update

echo [1/5] Baixando atualizacao do GitHub...
curl -L -o "%ZIP_FILE%" "%ZIP_URL%"
if errorlevel 1 (
    echo ERRO: Falha ao baixar o ZIP.
    pause
    exit /b 1
)

echo [2/5] Extraindo arquivos...
if exist "%EXTRACT_DIR%" rmdir /s /q "%EXTRACT_DIR%"
mkdir "%EXTRACT_DIR%"
tar -xf "%ZIP_FILE%" -C "%EXTRACT_DIR%"
if errorlevel 1 (
    echo ERRO: Falha ao extrair o ZIP.
    pause
    exit /b 1
)

echo [3/5] Copiando arquivos atualizados...
xcopy /s /y "%EXTRACT_DIR%\movidesk-ai-mcp-main\src" "%INSTALL_DIR%src\"
xcopy /s /y "%EXTRACT_DIR%\movidesk-ai-mcp-main\prompts" "%INSTALL_DIR%prompts\"
copy /y "%EXTRACT_DIR%\movidesk-ai-mcp-main\package.json" "%INSTALL_DIR%package.json"
copy /y "%EXTRACT_DIR%\movidesk-ai-mcp-main\tsconfig.json" "%INSTALL_DIR%tsconfig.json"

echo [4/5] Fazendo build...
cd /d "%INSTALL_DIR%"
call npm run build
if errorlevel 1 (
    echo ERRO: Falha no build.
    pause
    exit /b 1
)

echo [5/5] Reiniciando Claude Desktop...
taskkill /f /im Claude.exe >nul 2>&1
timeout /t 2 >nul
start "" "%LOCALAPPDATA%\Microsoft\WindowsApps\Claude.exe"

echo.
echo ========================================
echo  Atualizacao concluida com sucesso!
echo  Claude Desktop foi reiniciado.
echo ========================================
pause
