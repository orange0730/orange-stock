@echo off
echo.
echo ==========================================
echo 部署 Orange Stock 到 Cloud Run (除錯版)
echo ==========================================
echo.

:: 設定變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1

:: 顯示當前設定
echo 當前設定：
echo - Project ID: %PROJECT_ID%
echo - Service: %SERVICE_NAME%
echo - Region: %REGION%
echo.

:: 檢查 gcloud 是否安裝
echo 檢查 gcloud CLI...
gcloud --version
if errorlevel 1 (
    echo.
    echo ❌ 錯誤：找不到 gcloud 指令
    echo.
    echo 請先安裝 Google Cloud SDK：
    echo https://cloud.google.com/sdk/docs/install
    echo.
    pause
    exit /b 1
)

echo.
echo 檢查當前登入狀態...
gcloud auth list
echo.

echo 設定專案...
gcloud config set project %PROJECT_ID%
echo.

echo 當前專案設定：
gcloud config get-value project
echo.

:: 暫停讓使用者確認
echo 請確認以上資訊正確，按任意鍵繼續部署...
pause

:: 使用 gcloud run deploy 直接從原始碼部署
echo.
echo 開始部署 (這會自動建構 Docker 映像)...
echo.
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

:: 儲存錯誤碼
set DEPLOY_ERROR=%errorlevel%

if %DEPLOY_ERROR% neq 0 (
    echo.
    echo ❌ 部署失敗！錯誤碼：%DEPLOY_ERROR%
    echo.
    echo 可能的原因：
    echo 1. 尚未登入 gcloud - 執行: gcloud auth login
    echo 2. 沒有正確的權限
    echo 3. 專案 ID 不正確
    echo 4. 網路連線問題
    echo.
    echo 請複製上方的錯誤訊息以便除錯
) else (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 應用程式網址：
    echo https://orange-trade-1069330928314.asia-east1.run.app
    echo.
    echo 資料儲存：Google Firestore (持久化)
)

echo.
echo 按任意鍵關閉視窗...
pause >nul 