@echo off
cd /d "%~dp0源码"
node scripts\serve.mjs --open --chapter=2
if errorlevel 1 pause
