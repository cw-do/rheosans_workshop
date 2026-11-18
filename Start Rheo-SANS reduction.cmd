@echo off
rem Opens "From Runs to I(Q)" (the day-2 data reduction deck) in the default browser.
rem It uses the same small local web server as the EQ-SANS introduction (127.0.0.1:8718, see serve.py);
rem if that one is already running, this only opens the page. Keep the window open while presenting.
cd /d "%~dp0"
set "PY=%LOCALAPPDATA%\anaconda3\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" serve.py --page data_reduction/index.html %*
if errorlevel 1 pause
