@echo off
title Visual Launcher - Client & Backend
if "%LOCAL_ADMIN_PASSWORD%"=="" set /p "LOCAL_ADMIN_PASSWORD=Enter local administrator password: "
set "NODE=%~dp0system\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"
echo ====================================================
echo Starting Client Server (Port 3000)...
start "Client Server" /min "%NODE%" "%~dp0Client\server.js"

echo Starting Backend Server (Port 8080)...
start "Backend Server" /min "%NODE%" "%~dp0Backend\server.js"

echo Waiting for servers to initialize...
timeout /t 2 /nobreak >nul

echo Opening browser windows...
start "" "http://localhost:3000"
start "" "http://localhost:8080/admin.html#/admin/index/main.html?spm=m-1"

echo ====================================================
echo Both servers are running!
echo - Client:  http://localhost:3000
echo - Backend: http://localhost:8080/admin.html
echo ====================================================
echo Keep this window open or close it when done.
pause
