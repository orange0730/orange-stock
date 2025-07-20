@echo off
echo.
echo ==========================================
echo 部署 Orange Stock 到 Cloud Run (簡化版)
echo ==========================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1

echo 使用 Cloud Build 來建構和部署...
echo.

:: 確保在正確的專案
gcloud config set project %PROJECT_ID%

:: 使用 gcloud run deploy 直接從原始碼部署
echo 開始部署 (這會自動建構 Docker 映像)...
gcloud run deploy %SERVICE_NAME% ^
    --source . ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --set-env-vars NODE_ENV=production ^
    --set-env-vars FIRESTORE_ENABLED=true ^
    --set-env-vars FIRESTORE_PROJECT_ID=%PROJECT_ID% ^
    --set-env-vars FIRESTORE_KEY_PATH=./firestore-key.json ^
    --memory 512Mi ^
    --cpu 1 ^
    --max-instances 10

if errorlevel 1 (
    echo.
    echo 部署失敗！
    echo.
    echo 可能的原因：
    echo 1. 請確認已安裝並登入 gcloud
    echo 2. 請確認有正確的權限
    echo 3. 請確認專案 ID 正確
    pause
    exit /b 1
)

echo.
echo ✅ 部署成功！
echo.
echo 應用程式網址：
echo https://orange-trade-1069330928314.asia-east1.run.app
echo.
echo 資料儲存：Google Firestore (持久化)
echo.
pause 