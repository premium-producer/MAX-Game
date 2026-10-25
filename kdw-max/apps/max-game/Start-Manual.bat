@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher/Stand-Settings.ps1" -Action Manual
if errorlevel 1 exit /b 1
call "%~dp0Start-Pixel-Map.bat"
