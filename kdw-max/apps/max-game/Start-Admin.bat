@echo off
setlocal DisableDelayedExpansion
call "%~dp0Start.bat" -NoWindow
if errorlevel 1 exit /b %errorlevel%
start "" "http://127.0.0.1:18752/admin/"
exit /b 0
