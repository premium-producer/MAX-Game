@echo off
setlocal DisableDelayedExpansion
call "%~dp0Start.bat" stela %*
exit /b %errorlevel%
