@echo off
title WBS Engine 2.0 — Local Development
echo ======================================================================
echo    WBS Engine 2.0 - AI Project Breakdown & Work Structure Platform
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend API on http://localhost:5000 ...
start "WBS Backend API" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Vite Dev Server on http://localhost:5173 ...
start "WBS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers launched!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
pause
