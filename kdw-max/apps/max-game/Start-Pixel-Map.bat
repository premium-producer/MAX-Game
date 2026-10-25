@echo off
setlocal DisableDelayedExpansion
call "%~dp0Start.bat" -PixelMap %*
if errorlevel 1 pause
