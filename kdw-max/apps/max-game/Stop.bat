@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher/Control.ps1" -Action Stop %*
exit /b %errorlevel%
