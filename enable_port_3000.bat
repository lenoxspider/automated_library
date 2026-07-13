@echo off
:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ==========================================
    echo ENABLING PORT 3000 ON WINDOWS FIREWALL
    echo ==========================================
    powershell -Command "New-NetFirewallRule -DisplayName 'SmartLib Server (Port 3000)' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow"
    echo.
    echo Port 3000 enabled successfully!
) else (
    echo ==========================================
    echo ERROR: Admin Privileges Required
    echo ==========================================
    echo Please right-click this file and choose "Run as administrator".
)
echo.
pause
