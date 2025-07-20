@echo off
chcp 65001 >nul
echo ========================================
echo 流量管理：切換到 US-CENTRAL1
echo ========================================
echo.

set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade

echo 當前服務狀態：
echo.
echo ASIA-EAST1 狀態：
call gcloud run services describe %SERVICE_NAME% --region asia-east1 --format="value(status.url,status.conditions[0].message)" 2>nul
echo.
echo US-CENTRAL1 狀態：
call gcloud run services describe %SERVICE_NAME% --region us-central1 --format="value(status.url)" 2>nul
echo.

echo ========================================
echo 建議使用 US-CENTRAL1 服務
echo URL: https://orange-trade-1069330928314.us-central1.run.app
echo.
echo 您可以：
echo 1. 直接使用 us-central1 的 URL
echo 2. 執行 deploy-to-stable-region.bat 更新服務
echo 3. 在 DNS 設定中將域名指向 us-central1
echo ========================================
echo.

echo 要刪除失敗的 asia-east1 服務，執行：
echo gcloud run services delete %SERVICE_NAME% --region asia-east1 --quiet
echo.

pause 