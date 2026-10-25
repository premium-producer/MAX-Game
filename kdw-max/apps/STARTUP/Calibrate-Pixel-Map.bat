@echo off
setlocal DisableDelayedExpansion
call "%~dp0../max-game/Calibrate-Pixel-Map.bat" %*
exit /b %errorlevel%
