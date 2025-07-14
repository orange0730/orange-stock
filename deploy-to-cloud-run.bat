@echo off
setlocal enabledelayedexpansion

REM Google Cloud Run 部署腳本 (Windows 版)
REM 使用前請確保已安裝 gcloud CLI 並已登入

REM 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1
set IMAGE_NAME=orange-trade

echo ===================================
echo Orange Trade Google Cloud Run 部署腳本
echo ===================================
echo.

REM 設定專案
echo.
echo 設定 Google Cloud 專案...
call gcloud config set project %PROJECT_ID%

REM 啟用必要的 API
echo.
echo 啟用 Cloud Run 和 Container Registry API...
call gcloud services enable run.googleapis.com containerregistry.googleapis.com

REM 配置 Docker 認證
echo.
echo 配置 Docker 認證...
call gcloud auth configure-docker

REM 建立 Docker 映像
echo.
echo 建立 Docker 映像...
call docker build -t %IMAGE_NAME% .

REM 標記映像
echo.
echo 標記映像...
call docker tag %IMAGE_NAME% gcr.io/%PROJECT_ID%/%IMAGE_NAME%

REM 推送映像到 Container Registry
echo.
echo 推送映像到 Google Container Registry...
call docker push gcr.io/%PROJECT_ID%/%IMAGE_NAME%

REM 生成隨機 JWT 密鑰
echo.
echo 生成安全密鑰...
for /f "tokens=*" %%i in ('powershell -Command "[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))"') do set JWT_SECRET=%%i

REM 部署到 Cloud Run
echo.
echo 部署到 Cloud Run...
call gcloud run deploy %SERVICE_NAME% ^
    --image gcr.io/%PROJECT_ID%/%IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 3000 ^
    --memory 512Mi ^
    --max-instances 10 ^
    --set-env-vars "NODE_ENV=production,JWT_SECRET=%JWT_SECRET%"

REM 獲取服務 URL
echo.
echo 獲取服務 URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i

echo.
echo ===================================
echo 部署完成！
echo ===================================
echo 您的應用程式現在可以在以下網址訪問：
echo %SERVICE_URL%
echo.
echo 提示：
echo 1. 首次訪問可能需要幾秒鐘來啟動容器
echo 2. 使用 'gcloud run logs read --service=%SERVICE_NAME%' 查看日誌
echo 3. 使用 'gcloud run services update %SERVICE_NAME%' 更新環境變數
echo.
pause 