@echo off
echo.
echo ======================================
echo 清理 Container Registry 中的舊映像
echo ======================================
echo.

set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade

echo 列出所有映像版本...
gcloud container images list-tags gcr.io/%PROJECT_ID%/%SERVICE_NAME% --limit=999 --format="get(digest)"

echo.
echo 警告：這將刪除所有未使用的映像版本
echo 按 Ctrl+C 取消，或按任意鍵繼續...
pause >nul

echo.
echo 刪除舊映像...
for /f "tokens=*" %%i in ('gcloud container images list-tags gcr.io/%PROJECT_ID%/%SERVICE_NAME% --limit=999 --filter="-tags:*" --format="get(digest)"') do (
    echo 刪除 %%i
    gcloud container images delete gcr.io/%PROJECT_ID%/%SERVICE_NAME%@%%i --quiet --force-delete-tags
)

echo.
echo ✅ 清理完成
echo.
pause 