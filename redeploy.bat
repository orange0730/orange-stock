@echo off
echo ========================================
echo 重新部署 Orange Trade 到 Google Cloud Run
echo ========================================
echo.

echo 步驟 1: 構建新的 Docker 映像...
gcloud builds submit --tag gcr.io/orange-stock-465916/orange-trade .

if %errorlevel% neq 0 (
    echo 構建失敗！請檢查錯誤信息。
    pause
    exit /b 1
)

echo.
echo 步驟 2: 部署到 Cloud Run...
gcloud run deploy orange-trade ^
  --image gcr.io/orange-stock-465916/orange-trade ^
  --platform managed ^
  --region us-central1

if %errorlevel% neq 0 (
    echo 部署失敗！請檢查錯誤信息。
    pause
    exit /b 1
)

echo.
echo ========================================
echo 部署成功完成！
echo 服務 URL: https://orange-trade-1069330928314.us-central1.run.app
echo ========================================
pause