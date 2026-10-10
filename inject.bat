@echo off
REM EGO TOOL - One-click injector for Windows
REM Made by shoyzontop
title EGO TOOL Injector
echo ==========================================
echo       EGO TOOL - Vencord Plugin Injector
echo             made by shoyzontop
echo   (no reinstall, no reset - inject only)
echo ==========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0inject.ps1" %*
echo.
pause