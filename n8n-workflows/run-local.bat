@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js no esta en PATH. Instala Node 18+ desde https://nodejs.org
  pause
  exit /b 1
)
node n8n-local.mjs
if errorlevel 1 pause
