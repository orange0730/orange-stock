@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo 🚀 部署 Orange Stock 到 Cloud Run
echo    (使用 Azure Cosmos DB)
echo ==========================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

:: 檢查環境變數
if "%COSMOS_ENDPOINT%"=="" (
    echo ❌ 錯誤：請先設定 Cosmos DB 環境變數
    echo.
    echo 在環境變數或 .env 檔案中設定：
    echo   COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
    echo   COSMOS_KEY=your-primary-key
    echo.
    pause
    exit /b 1
)

echo 📋 部署設定：
echo   專案 ID: %PROJECT_ID%
echo   服務名稱: %SERVICE_NAME%
echo   區域: %REGION%
echo   Cosmos DB: 已啟用
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
    --set-env-vars "COSMOS_ENABLED=true" ^
    --set-env-vars "COSMOS_ENDPOINT=%COSMOS_ENDPOINT%" ^
    --set-env-vars "COSMOS_KEY=%COSMOS_KEY%" ^
    --set-env-vars "COSMOS_DATABASE=orange-stock" ^
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
echo 📊 資料儲存：Azure Cosmos DB (持久化)
echo.
echo 下一步：
echo 1. 訪問應用程式測試功能
echo 2. 在 Azure Portal 監控 Cosmos DB 使用情況
echo 3. 查看 Cloud Run 日誌確認運行狀態
echo.
pause 