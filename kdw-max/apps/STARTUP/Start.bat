@echo off
setlocal DisableDelayedExpansion
set "KDW_TARGET=%~1"
set "KDW_STELA="
set "KDW_GAME="
set "KDW_MODE=%~2"
if not "%KDW_MODE%"=="" if /i not "%KDW_MODE%"=="-NoWindow" exit /b 2

if "%KDW_TARGET%"=="" goto select_all
if /i "%KDW_TARGET%"=="all" goto select_all
if /i "%KDW_TARGET%"=="stela" goto select_stela
if /i "%KDW_TARGET%"=="max-game" goto select_game
echo Usage: Start.bat [all^|stela^|max-game] [-NoWindow]
exit /b 2

:select_all
if exist "%~dp0../stela/" set "KDW_STELA=1"
if exist "%~dp0../max-game/" set "KDW_GAME=1"
if defined KDW_STELA goto validate
if defined KDW_GAME goto validate
echo ERROR: No applications found next to STARTUP.
exit /b 1

:select_stela
set "KDW_STELA=1"
goto validate

:select_game
set "KDW_GAME=1"

:validate
if defined KDW_STELA if not exist "%~dp0../stela/Start.bat" goto missing_stela
if defined KDW_GAME if not exist "%~dp0../max-game/Start.bat" goto missing_game
if defined KDW_STELA (
  pushd "%~dp0../stela" || exit /b 1
  call "./Start.bat" %KDW_MODE%
  if errorlevel 1 goto launch_failed
  popd
)
if defined KDW_GAME (
  pushd "%~dp0../max-game" || exit /b 1
  call "./Start.bat" %KDW_MODE%
  if errorlevel 1 goto launch_failed
  popd
)
exit /b 0

:missing_stela
echo ERROR: Missing stela/Start.bat. Copy a complete stela application next to STARTUP.
exit /b 1

:missing_game
echo ERROR: Missing max-game/Start.bat. Copy a complete max-game application next to STARTUP.
exit /b 1

:launch_failed
popd
echo ERROR: An application launcher failed.
exit /b 1
