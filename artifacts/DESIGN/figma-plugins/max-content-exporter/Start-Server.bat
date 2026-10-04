@echo off
setlocal
cd /d "%~dp0"
call "..\pdf-export\Start-Server.bat" %*
