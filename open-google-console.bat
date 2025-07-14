@echo off
echo ========================================
echo 開啟 Google Cloud Console - Orange Trade
echo ========================================
echo.
echo 選擇要開啟的頁面：
echo.
echo 1. Cloud Run 服務詳情（主要）
echo 2. Cloud Run 服務列表
echo 3. Container Registry（Docker 映像）
echo 4. Cloud Build 歷史記錄
echo 5. 應用程式日誌
echo 6. 專案儀表板
echo 7. 計費和用量
echo 8. 開啟所有頁面
echo.
set /p choice="請輸入選項 (1-8): "

if "%choice%"=="1" start https://console.cloud.google.com/run/detail/us-central1/orange-trade/metrics?project=orange-stock-465916
if "%choice%"=="2" start https://console.cloud.google.com/run?project=orange-stock-465916
if "%choice%"=="3" start https://console.cloud.google.com/gcr/images/orange-stock-465916?project=orange-stock-465916
if "%choice%"=="4" start https://console.cloud.google.com/cloud-build/builds?project=orange-stock-465916
if "%choice%"=="5" start https://console.cloud.google.com/logs/query?project=orange-stock-465916
if "%choice%"=="6" start https://console.cloud.google.com/home/dashboard?project=orange-stock-465916
if "%choice%"=="7" start https://console.cloud.google.com/billing/linkedaccount?project=orange-stock-465916
if "%choice%"=="8" (
    start https://console.cloud.google.com/run/detail/us-central1/orange-trade/metrics?project=orange-stock-465916
    timeout /t 1 >nul
    start https://console.cloud.google.com/gcr/images/orange-stock-465916?project=orange-stock-465916
    timeout /t 1 >nul
    start https://console.cloud.google.com/cloud-build/builds?project=orange-stock-465916
)

echo.
echo 頁面已在瀏覽器中開啟！
pause