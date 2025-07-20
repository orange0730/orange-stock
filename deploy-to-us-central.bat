@echo off
chcp 65001 >nul
echo ========================================
echo 部署到 us-central1 區域（避開 asia-east1 問題）
echo ========================================
echo.

REM 設定環境變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade-us
set REGION=us-central1
set PORT=3000

echo 步驟 1: 確認專案設定
call gcloud config set project %PROJECT_ID%
echo.

echo 步驟 2: 部署到 us-central1
echo 使用 Buildpacks 自動建置...
call gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --port %PORT% ^
  --memory 512Mi ^
  --timeout 300 ^
  --max-instances 10 ^
  --set-env-vars NODE_ENV=production

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo 部署成功！
    echo 服務 URL: https://%SERVICE_NAME%-%PROJECT_ID%.%REGION%.run.app
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 部署失敗，錯誤代碼: %ERRORLEVEL%
    echo ========================================
)

pause 