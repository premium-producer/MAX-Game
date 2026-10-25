@echo off
setlocal DisableDelayedExpansion
call "%~dp0Start.bat" -PixelMapDebug %*
if errorlevel 1 pause
