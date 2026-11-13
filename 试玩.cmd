@echo off
cd /d "%~dp0源码"
node scripts\serve.mjs --open
if errorlevel 1 pause
