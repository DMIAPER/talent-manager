@echo off
title Talent Manager Pro
echo =======================================================
echo          INICIANDO TALENT MANAGER PRO
echo    (Backend FastAPI + Frontend React en Vite)
echo =======================================================
echo.

echo Iniciando Backend FastAPI en http://127.0.0.1:8000 ...
start "Talent Manager Backend" python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

timeout /t 2 /nobreak > nul

echo Iniciando Frontend React en http://localhost:5173 ...
cd frontend
start "Talent Manager Frontend" cmd.exe /c "npm run dev"

echo.
echo Todo listo! Puedes acceder en tu navegador a:
echo  -> http://localhost:5173
echo.
pause
