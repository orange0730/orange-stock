@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   設置 GitHub 自動部署
echo ===================================
echo.

echo 這個腳本會幫助您設置自動部署
echo 當您推送代碼到 GitHub 時，會自動部署到 Google Cloud Run
echo.

echo 請選擇設置方式：
echo 1. 使用 Cloud Build 觸發器（推薦）
echo 2. 查看詳細設置指南
echo 3. 退出
echo.

set /p choice="請輸入選項 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 正在開啟 Cloud Build 觸發器設置頁面...
    echo.
    echo 請按照以下步驟操作：
    echo 1. 在瀏覽器中連接您的 GitHub 儲存庫
    echo 2. 創建名為 'auto-deploy-orange-trade' 的觸發器
    echo 3. 設定分支為 'master' 或 'main'
    echo 4. 設定 Cloud Build 設定檔位置為 '/cloudbuild.yaml'
    echo.
    start https://console.cloud.google.com/cloud-build/triggers?project=orange-stock-465916
    echo.
    echo cloudbuild.yaml 檔案已經創建在專案根目錄！
    echo.
    pause
) else if "%choice%"=="2" (
    echo.
    echo 正在開啟設置指南...
    start setup-auto-deploy.md
    pause
) else if "%choice%"=="3" (
    exit
) else (
    echo 無效的選項！
    pause
    exit
) 