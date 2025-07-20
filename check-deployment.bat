@echo off
echo ========================================
echo Orange Trade 部署狀態檢查
echo ========================================
echo.

echo 1. 檢查服務狀態...
gcloud run services describe orange-trade --region us-central1 --format="value(status.url)"
echo.

echo 2. 查看最近的日誌...
gcloud run logs tail orange-trade --region us-central1 --limit=20
echo.

echo 3. 查看服務詳情...
gcloud run services describe orange-trade --region us-central1
echo.

echo ========================================
echo 服務 URL: https://orange-trade-1069330928314.us-central1.run.app
echo ========================================
pause