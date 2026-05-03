@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js no esta en PATH.
  pause
  exit /b 1
)
echo.
echo IMPORTANTE: Cierra n8n (ventana donde corre run-local.bat) antes de importar.
echo Si n8n esta abierto puede fallar o corromper la base SQLite.
echo.
pause
node n8n-local.mjs import
if errorlevel 1 pause
