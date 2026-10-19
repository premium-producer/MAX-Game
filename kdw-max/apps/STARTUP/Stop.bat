@echo off
setlocal DisableDelayedExpansion
set "KDW_STATUS=0"
if exist "%~dp0../stela/Stop.bat" (
  call "%~dp0../stela/Stop.bat"
  if errorlevel 1 set "KDW_STATUS=1"
)
if exist "%~dp0../max-game/Stop.bat" (
  call "%~dp0../max-game/Stop.bat"
  if errorlevel 1 set "KDW_STATUS=1"
)
exit /b %KDW_STATUS%
