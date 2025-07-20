@echo off
chcp 65001 >nul
echo ========================================
echo 完全清理並重新部署 Orange Trade
echo ========================================
echo.

REM 設定環境變數
set PROJECT_ID=orange-stock-465916
set SERVICE_NAME=orange-trade
set REGION=asia-east1
set PORT=3000

echo 步驟 1: 刪除現有服務
echo 正在刪除舊服務...
call gcloud run services delete %SERVICE_NAME% --region %REGION% --quiet
echo.

echo 步驟 2: 等待 30 秒讓系統完全清理
echo 請稍候...
timeout /t 30 /nobreak >nul
echo.

echo 步驟 3: 清理 Container Registry
echo 清理舊的容器映像...
for /f "tokens=*" %%i in ('gcloud container images list --repository=gcr.io/%PROJECT_ID% --format="get(name)"') do (
    echo 刪除映像: %%i
    call gcloud container images delete %%i --quiet --force-delete-tags
)
echo.

echo 步驟 4: 建立新的 .gcloudignore
echo 更新 .gcloudignore...
(
echo node_modules/
echo .git/
echo .gitignore
echo *.log
echo .env
echo .env.local
echo test/
echo tests/
echo coverage/
echo .nyc_output/
echo *.md
echo !README.md
echo .dockerignore
echo Dockerfile*
echo docker-compose*
echo *.bat
echo *.ps1
echo *.sh
echo deploy-*
echo clear-*
echo redeploy-*
echo cosmos-key.json
) > .gcloudignore
echo.

echo 步驟 5: 重新部署服務
echo 使用 Buildpacks 部署...
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
    echo 服務 URL: https://%SERVICE_NAME%-1069330928314.%REGION%.run.app
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 部署失敗，錯誤代碼: %ERRORLEVEL%
    echo 建議嘗試 deploy-to-us-central.bat
    echo ========================================
)

pause 