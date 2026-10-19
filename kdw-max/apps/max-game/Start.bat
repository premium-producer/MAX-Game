@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher/Launch.ps1"  %*
exit /b %errorlevel%
