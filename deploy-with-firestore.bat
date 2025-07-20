@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo 🚀 部署 Orange Stock 到 Cloud Run
echo    (使用 Google Firestore)
echo ==========================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-a65bb
set SERVICE_NAME=orange-trade
set REGION=asia-east1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

:: 檢查 firestore-key.json
if not exist "firestore-key.json" (
    echo ❌ 錯誤：找不到 firestore-key.json
    echo.
    echo 請確保已從 Firebase Console 下載服務帳戶金鑰
    echo.
    pause
    exit /b 1
)

echo 📋 部署設定：
echo   Project ID: %PROJECT_ID%
echo   Service Name: %SERVICE_NAME%
echo   Region: %REGION%
echo   Firestore: Enabled
echo.

echo 🔨 建構 Docker 映像...
docker build -t %IMAGE_NAME% .
if errorlevel 1 (
    echo ❌ Docker 建構失敗
    pause
    exit /b 1
)

echo.
echo 📤 推送映像到 Google Container Registry...
docker push %IMAGE_NAME%
if errorlevel 1 (
    echo ❌ 映像推送失敗
    pause
    exit /b 1
)

echo.
echo 🚀 部署到 Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --set-env-vars "NODE_ENV=production" ^
    --set-env-vars "FIRESTORE_ENABLED=true" ^
    --set-env-vars "FIRESTORE_PROJECT_ID=%PROJECT_ID%" ^
    --set-env-vars "FIRESTORE_KEY_PATH=./firestore-key.json" ^
    --memory 512Mi ^
    --cpu 1 ^
    --max-instances 10 ^
    --project %PROJECT_ID%

if errorlevel 1 (
    echo ❌ 部署失敗
    pause
    exit /b 1
)

echo.
echo ✅ 部署成功！
echo.
echo 🌐 應用程式網址：
echo    https://orange-trade-1069330928314.asia-east1.run.app
echo.
echo 📊 資料儲存：Google Firestore (持久化)
echo.
echo 下一步：
echo 1. 訪問應用程式測試功能
echo 2. 在 Firebase Console 查看 Firestore 資料
echo 3. 查看 Cloud Run 日誌確認運行狀態
echo.
pause 