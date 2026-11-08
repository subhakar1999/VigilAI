@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-ai-examples.ps1"
exit /b %ERRORLEVEL%
