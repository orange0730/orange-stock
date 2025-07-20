@echo off
echo.
echo ========================================
echo 更新 Cloud Run 環境變數以啟用 Firestore
echo ========================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1

echo 正在更新環境變數...
echo.

:: 只更新環境變數，不重新部署容器
gcloud run services update %SERVICE_NAME% ^
    --region %REGION% ^
    --update-env-vars ^
NODE_ENV=production,^
FIRESTORE_ENABLED=true,^
FIRESTORE_PROJECT_ID=%PROJECT_ID%,^
FIRESTORE_KEY_PATH=./firestore-key.json

if errorlevel 1 (
    echo.
    echo ❌ 更新失敗！
    echo.
    echo 請確認：
    echo 1. 服務是否正在運行
    echo 2. 您是否有權限
    echo.
) else (
    echo.
    echo ✅ 環境變數更新成功！
    echo.
    echo 應用程式應該會在幾秒內重新啟動
    echo.
    echo 網址：
    echo https://orange-trade-1069330928314.asia-east1.run.app
    echo.
    echo 請稍等片刻後測試應用程式
)

echo.
echo 按任意鍵關閉...
pause >nul 