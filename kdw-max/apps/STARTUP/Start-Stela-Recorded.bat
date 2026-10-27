@echo off
setlocal DisableDelayedExpansion
if not exist "%~dp0..\stela\Start-Recorded.bat" (
  echo Stella was not found. Keep STARTUP next to the stela folder.
  pause
  exit /b 1
)
call "%~dp0..\stela\Start-Recorded.bat"
set "stelaExitCode=%errorlevel%"
if not "%stelaExitCode%"=="0" pause
exit /b %stelaExitCode%
