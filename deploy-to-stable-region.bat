@echo off
chcp 65001 >nul
echo ========================================
echo 部署到 US-CENTRAL1（已存在的穩定服務）
echo ========================================
echo.

REM 設定環境變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=us-central1
set PORT=3000

echo 當前狀態：
echo - asia-east1: 修訂版本失敗 (Container import failed)
echo - us-central1: 服務正常運行
echo.
echo 將更新 us-central1 的服務...
echo.

echo 步驟 1: 確認專案設定
call gcloud config set project %PROJECT_ID%
echo.

echo 步驟 2: 部署更新到 us-central1
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
  --set-env-vars NODE_ENV=production,FIRESTORE_ENABLED=true,FIRESTORE_PROJECT_ID=orange-stock-465916,FIRESTORE_KEY_PATH=./firestore-key.json

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo 部署成功！
    echo 服務 URL: https://%SERVICE_NAME%-1069330928314.%REGION%.run.app
    echo.
    echo 建議：
    echo 1. 測試 us-central1 服務是否正常
    echo 2. 如果正常，可以刪除 asia-east1 的失敗服務
    echo    使用: gcloud run services delete %SERVICE_NAME% --region asia-east1
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 部署失敗，錯誤代碼: %ERRORLEVEL%
    echo ========================================
)

pause 