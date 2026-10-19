@echo off
setlocal DisableDelayedExpansion
set "KDW_STATUS=0"
if exist "%~dp0../stela/Check.bat" (
  call "%~dp0../stela/Check.bat"
  if errorlevel 1 set "KDW_STATUS=1"
)
if exist "%~dp0../max-game/Check.bat" (
  call "%~dp0../max-game/Check.bat"
  if errorlevel 1 set "KDW_STATUS=1"
)
exit /b %KDW_STATUS%
