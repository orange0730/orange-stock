@echo off
echo.
echo ======================================
echo 直接部署到 Cloud Run (使用 Firestore)
echo ======================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1

:: 1. 安裝依賴（確保 package.json 是最新的）
echo 步驟 1：安裝依賴...
call npm install
if errorlevel 1 (
    echo 錯誤：npm install 失敗
    pause
    exit /b 1
)

:: 2. 使用已存在的服務，只更新代碼
echo.
echo 步驟 2：部署到現有的 Cloud Run 服務...
echo.
echo 這會使用 Cloud Build 建構並部署您的應用程式
echo 請耐心等待（約 3-5 分鐘）...
echo.

gcloud run deploy %SERVICE_NAME% ^
    --source . ^
    --region %REGION% ^
    --platform managed ^
    --allow-unauthenticated ^
    --memory 512Mi ^
    --cpu 1 ^
    --max-instances 10 ^
    --set-env-vars ^
NODE_ENV=production,^
FIRESTORE_ENABLED=true,^
FIRESTORE_PROJECT_ID=%PROJECT_ID%,^
FIRESTORE_KEY_PATH=./firestore-key.json

if errorlevel 1 (
    echo.
    echo ❌ 部署失敗
    echo.
    echo 如果看到 "Container import failed" 錯誤：
    echo 1. 請稍等幾分鐘後再試
    echo 2. 或嘗試執行 clear-artifacts.bat 清理舊的映像
    echo.
) else (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 您的應用程式網址：
    echo https://orange-trade-1069330928314.asia-east1.run.app
    echo.
    echo 資料儲存：Google Firestore (持久化)
    echo.
    echo 請等待 1-2 分鐘讓服務完全啟動
)

echo.
echo 按任意鍵關閉...
pause >nul 