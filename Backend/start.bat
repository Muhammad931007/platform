@echo off
if "%LOCAL_ADMIN_PASSWORD%"=="" set /p "LOCAL_ADMIN_PASSWORD=Enter local administrator password: "
set "NODE=%~dp0..\system\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"
"%NODE%" server.js
pause
