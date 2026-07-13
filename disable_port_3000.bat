@echo off
:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ==========================================
    echo DISABLING PORT 3000 ON WINDOWS FIREWALL
    echo ==========================================
    powershell -Command "Remove-NetFirewallRule -DisplayName 'SmartLib Server (Port 3000)'"
    echo.
    echo Port 3000 firewall rule removed successfully!
) else (
    echo ==========================================
    echo ERROR: Admin Privileges Required
    echo ==========================================
    echo Please right-click this file and choose "Run as administrator".
)
echo.
pause
