@echo off
chcp 65001 >nul
echo ========================================
echo 檢查 Cloud Run 配額和服務狀態
echo ========================================
echo.

set PROJECT_ID=orange-stock-465916

echo 步驟 1: 設定專案
call gcloud config set project %PROJECT_ID%
echo.

echo 步驟 2: 檢查 Cloud Run 服務列表
echo ----------------------------------------
call gcloud run services list --platform managed
echo.

echo 步驟 3: 檢查 asia-east1 區域的服務詳情
echo ----------------------------------------
call gcloud run services describe orange-trade --region asia-east1 --platform managed 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 服務不存在於 asia-east1
)
echo.

echo 步驟 4: 檢查專案配額
echo ----------------------------------------
echo 正在檢查 Cloud Run API 配額...
call gcloud compute project-info describe --project=%PROJECT_ID% 2>nul | findstr /i "quota"
echo.

echo 步驟 5: 列出所有區域的 Cloud Run 服務
echo ----------------------------------------
for %%r in (asia-east1 us-central1 us-east1 europe-west1) do (
    echo.
    echo 檢查區域: %%r
    call gcloud run services list --region %%r --platform managed --format="table(name,region,url)" 2>nul
)

echo.
echo 步驟 6: 檢查 Container Registry 映像
echo ----------------------------------------
call gcloud container images list --repository=gcr.io/%PROJECT_ID%
echo.

echo 步驟 7: 檢查 Artifact Registry 映像
echo ----------------------------------------
call gcloud artifacts repositories list 2>nul
echo.

echo ========================================
echo 檢查完成！
echo.
echo 如果看到太多失敗的修訂版本，
echo 建議使用 redeploy-clean.bat 完全清理重建
echo ========================================

pause 