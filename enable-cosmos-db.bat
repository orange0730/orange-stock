@echo off
chcp 65001 > nul
echo.
echo ===================================
echo 🚀 啟用 Azure Cosmos DB
echo ===================================
echo.

:: 檢查是否已設定環境變數
if "%COSMOS_ENDPOINT%"=="" (
    echo ❌ 錯誤：COSMOS_ENDPOINT 未設定
    echo.
    echo 請先設定以下環境變數：
    echo   set COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
    echo   set COSMOS_KEY=your-primary-key
    echo.
    echo 或創建 .env 檔案並添加：
    echo   COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
    echo   COSMOS_KEY=your-primary-key
    echo.
    pause
    exit /b 1
)

echo 📋 環境變數設定：
echo   COSMOS_ENDPOINT: %COSMOS_ENDPOINT%
echo   COSMOS_KEY: [已隱藏]
echo   COSMOS_DATABASE: %COSMOS_DATABASE%
echo.

echo 🔍 測試 Cosmos DB 連接...
node test-cosmos.js
if errorlevel 1 (
    echo.
    echo ❌ Cosmos DB 連接測試失敗
    pause
    exit /b 1
)

echo.
echo ✅ Cosmos DB 連接成功！
echo.
echo 🚀 啟動應用程式 (Cosmos DB 模式)...
echo.

set COSMOS_ENABLED=true
npm start

pause 