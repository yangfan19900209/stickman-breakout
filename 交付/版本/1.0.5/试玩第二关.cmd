@echo off
cd /d "%~dp0"
node preview.cjs --open
if errorlevel 1 pause
