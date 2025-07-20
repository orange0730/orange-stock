@echo off
chcp 65001 > nul
echo.
echo ===================================
echo 🚀 啟用 Google Firestore
echo ===================================
echo.

:: 檢查 firestore-key.json 是否存在
if not exist "firestore-key.json" (
    echo ❌ 錯誤：找不到 firestore-key.json
    echo.
    echo 請確保已從 Firebase Console 下載服務帳戶金鑰
    echo 並命名為 firestore-key.json
    echo.
    pause
    exit /b 1
)

echo 📋 Firestore 設定：
echo   金鑰檔案: firestore-key.json ✓
echo   專案 ID: %FIRESTORE_PROJECT_ID%
echo.

echo 🔍 測試 Firestore 連接...
node test-firestore.js
if errorlevel 1 (
    echo.
    echo ❌ Firestore 連接測試失敗
    pause
    exit /b 1
)

echo.
echo ✅ Firestore 連接成功！
echo.
echo 🚀 啟動應用程式 (Firestore 模式)...
echo.

set FIRESTORE_ENABLED=true
npm start

pause 