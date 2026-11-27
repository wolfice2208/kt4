@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv .venv || goto :error
)

".venv\Scripts\python.exe" -c "import fastapi, uvicorn, sse_starlette" >nul 2>&1
if errorlevel 1 (
  echo Installing backend dependencies...
  ".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt || goto :error
)

echo Starting FastAPI backend on http://127.0.0.1:8010 ...
".venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8010 --app-dir backend
goto :eof

:error
echo Failed to start backend.
exit /b 1
