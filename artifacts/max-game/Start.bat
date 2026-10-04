@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required for standalone mode. You can also open this game through Stand Service.
  pause
  exit /b 1
)
node start.mjs %*
