@echo off
cd /d "%~dp0"
if not exist .venv py -m venv .venv || python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
echo.
echo Servicio ML en http://127.0.0.1:5000  (mantener esta ventana abierta)
echo.
python app.py
pause
