@echo off
title SmartLib System Launcher
echo ==========================================
echo Starting SmartLib System...
echo ==========================================

echo Starting Backend Server in a new window...
start "SmartLib Backend Server" cmd /k "npm run dev"

echo Starting Frontend Dev Server in a new window...
start "SmartLib Frontend Server" cmd /k "cd client && npm run dev"

echo ==========================================
echo Launcher finished! Both servers are starting.
echo You can close this window.
echo ==========================================
pause
