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

echo [2/5] Extraindo arquivos via PowerShell...
if exist "%EXTRACT_DIR%" rmdir /s /q "%EXTRACT_DIR%"
mkdir "%EXTRACT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('%ZIP_FILE%'); foreach ($entry in $zip.Entries) { $dest = Join-Path '%EXTRACT_DIR%' $entry.FullName; $destDir = Split-Path $dest; if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }; if ($entry.Name -ne '') { try { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true) } catch { Write-Host 'Ignorando arquivo invalido:' $entry.FullName } } }; $zip.Dispose() } catch { Write-Host 'Erro:' $_.Exception.Message; exit 1 }"
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
