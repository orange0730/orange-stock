@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   測試 Firestore 連接
echo ===================================
echo.

node test-firestore.js

echo.
pause 