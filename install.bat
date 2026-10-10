@echo off
REM EGO TOOL - One-click installer for Windows
REM Made by shoyzontop
title EGO TOOL Installer
echo ==========================================
echo        EGO TOOL - Vencord Installer
echo            made by shoyzontop
echo ==========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
pause