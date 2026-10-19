@echo off
setlocal DisableDelayedExpansion
call "%~dp0Start.bat" max-game %*
exit /b %errorlevel%
