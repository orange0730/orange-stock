@echo off
echo ===================================
echo Orange Trade 部署工具安裝指南
echo ===================================
echo.
echo 請按照以下步驟安裝所需工具：
echo.
echo 1. 安裝 Git for Windows
echo    正在開啟 Git 下載頁面...
start https://git-scm.com/download/win
echo.
echo 2. 安裝 Google Cloud SDK
echo    正在開啟 Google Cloud SDK 下載頁面...
start https://cloud.google.com/sdk/docs/install
echo.
echo 3. 安裝 Docker Desktop (選用，但建議安裝)
echo    正在開啟 Docker Desktop 下載頁面...
start https://www.docker.com/products/docker-desktop/
echo.
echo ===================================
echo 安裝完成後的步驟：
echo ===================================
echo.
echo 1. 重新開啟 PowerShell 或 Command Prompt
echo 2. 執行: git --version (確認 Git 已安裝)
echo 3. 執行: gcloud --version (確認 Google Cloud SDK 已安裝)
echo 4. 執行: docker --version (確認 Docker 已安裝)
echo.
echo 5. 閱讀 GOOGLE_CLOUD_RUN_DEPLOYMENT.md 檔案以繼續部署
echo.
pause 