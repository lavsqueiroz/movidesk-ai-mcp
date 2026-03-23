@echo off
echo ========================================
echo  Movidesk MCP - Watch Mode
echo  Monitora mudancas e rebuilda auto
echo  Pressione CTRL+C para parar
echo ========================================
echo.

cd /d "%~dp0"

set LAST_BUILD=0

:loop
for /f %%i in ('dir /s /b /a-d src\*.ts 2^>nul ^| findstr /v ".d.ts"') do (
    for /f %%j in ('forfiles /p "%~dp0src" /s /m *.ts /c "cmd /c echo @fdate @ftime" 2^>nul') do set CURRENT=%%j
)

for /f "tokens=*" %%a in ('powershell -command "(Get-ChildItem -Recurse src -Filter *.ts | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime.Ticks"') do set CURRENT_TICKS=%%a

if not "%CURRENT_TICKS%"=="%LAST_BUILD%" (
    if not "%LAST_BUILD%"=="0" (
        echo.
        echo [%time%] Mudanca detectada - rebuilding...
        call npm run build
        if not errorlevel 1 (
            echo [%time%] Build OK! Reiniciando Claude Desktop...
            taskkill /f /im Claude.exe >nul 2>&1
            timeout /t 2 >nul
            start "" "%LOCALAPPDATA%\Microsoft\WindowsApps\Claude.exe"
            echo [%time%] Claude reiniciado!
        ) else (
            echo [%time%] ERRO no build - verifique o codigo.
        )
    )
    set LAST_BUILD=%CURRENT_TICKS%
)

timeout /t 3 >nul
goto loop
