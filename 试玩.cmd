@echo off
cd /d "%~dp0"
node scripts\serve.mjs --open
if errorlevel 1 pause
