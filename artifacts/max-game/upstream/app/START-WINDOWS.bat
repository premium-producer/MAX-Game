@echo off
setlocal
cd /d "%~dp0"

set "XSP_NODE=%~dp0runtime\win-x64\node.exe"
if not exist "%XSP_NODE%" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Portable Node runtime is missing.
    echo Restore runtime\win-x64\node.exe or install Node.js.
    pause
    exit /b 1
  )
  set "XSP_NODE=node"
)

"%XSP_NODE%" --watch --watch-preserve-output "%~dp0server.mjs" --open
