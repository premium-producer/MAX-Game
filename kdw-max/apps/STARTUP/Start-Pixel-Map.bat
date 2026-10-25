@echo off
setlocal DisableDelayedExpansion
call "%~dp0../max-game/Start-Pixel-Map.bat" %*
if errorlevel 1 exit /b 1
if exist "%~dp0../stela/Start.bat" call "%~dp0../stela/Start.bat" %*
exit /b %errorlevel%
