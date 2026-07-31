@echo off
cd /d "%~dp0"
echo Starting local server at http://localhost:8000
echo Press Ctrl+C in this window to stop it.
start "" http://localhost:8000
python -m http.server 8000
if errorlevel 1 (
  echo.
  echo Python wasn't found. If you have Node.js instead, run:
  echo   npx serve -l 8000
  pause
)
