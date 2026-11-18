@echo off
rem Opens the RheoSANS workshop front page: three cards, one for each deck (introduction, data reduction, data analysis).
rem It starts a small local web server (127.0.0.1:8718, see serve.py), which the 3D model in the first deck needs;
rem if that one is already running, this only opens the page. Keep the window open while presenting.
cd /d "%~dp0"
set "PY=%LOCALAPPDATA%\anaconda3\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" serve.py --page index.html %*
if errorlevel 1 pause
