@echo off
rem Opens "Introduction to EQ-SANS" in the default browser.
rem The deck embeds the 3D model, which a browser only loads from a web server, so this starts
rem a small one on this machine (127.0.0.1:8718, see serve.py). Keep this window open while presenting.
cd /d "%~dp0"
set "PY=%LOCALAPPDATA%\anaconda3\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" serve.py %*
if errorlevel 1 pause
