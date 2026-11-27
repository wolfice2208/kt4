@echo off
setlocal
cd /d "%~dp0frontend"

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install || goto :error
)

echo Starting Vite dev server on http://localhost:5173 ...
call npm run dev
goto :eof

:error
echo Failed to start frontend.
exit /b 1
