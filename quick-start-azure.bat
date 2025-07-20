@echo off
echo ================================================
echo     Orange Trade Azure Web App Quick Start
echo ================================================
echo.

echo Welcome to Azure Web App deployment wizard!
echo.
echo Before we start, please make sure you have:
echo    - Azure account with valid subscription
echo    - Azure CLI installed and logged in
echo    - Unique application name ready
echo.

REM 檢查 Azure CLI 是否已安裝
echo 🔍 檢查 Azure CLI...
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Azure CLI
    echo 📥 請前往安裝: https://docs.microsoft.com/cli/azure/install-azure-cli
    pause
    exit /b 1
)
echo ✅ Azure CLI 已安裝

REM 檢查是否已登入
echo 🔐 檢查登入狀態...
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔑 需要登入 Azure...
    az login
    if %errorlevel% neq 0 (
        echo ❌ 登入失敗
        pause
        exit /b 1
    )
)
echo ✅ 已登入 Azure

echo.
echo 📝 請輸入您的配置資訊：
echo.

REM 獲取應用程式名稱
set /p APP_NAME="🏷️  輸入應用程式名稱 (例: my-orange-trade): "
if "%APP_NAME%"=="" (
    echo ❌ 應用程式名稱不能為空
    pause
    exit /b 1
)

REM 獲取資源群組
set /p RESOURCE_GROUP="📦 輸入資源群組名稱 (預設: %APP_NAME%-rg): "
if "%RESOURCE_GROUP%"=="" set RESOURCE_GROUP=%APP_NAME%-rg

REM 獲取位置
echo.
echo 🌍 選擇部署區域：
echo    1. East Asia (東亞 - 香港)
echo    2. Southeast Asia (東南亞 - 新加坡)
echo    3. Japan East (日本東部)
echo    4. Korea Central (韓國中部)
echo    5. Australia East (澳洲東部)
echo.
set /p LOCATION_CHOICE="選擇區域 (1-5, 預設: 1): "
if "%LOCATION_CHOICE%"=="" set LOCATION_CHOICE=1

if "%LOCATION_CHOICE%"=="1" set LOCATION=East Asia
if "%LOCATION_CHOICE%"=="2" set LOCATION=Southeast Asia
if "%LOCATION_CHOICE%"=="3" set LOCATION=Japan East
if "%LOCATION_CHOICE%"=="4" set LOCATION=Korea Central
if "%LOCATION_CHOICE%"=="5" set LOCATION=Australia East

echo.
echo 📋 確認配置資訊：
echo    應用程式名稱: %APP_NAME%
echo    資源群組: %RESOURCE_GROUP%
echo    部署區域: %LOCATION%
echo.

set /p CONFIRM="✅ 確認開始部署嗎？ (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo ❌ 已取消部署
    pause
    exit /b 0
)

echo.
echo 🚀 開始部署流程...
echo.

REM 建立資源群組
echo 🏗️  建立資源群組...
az group create --name "%RESOURCE_GROUP%" --location "%LOCATION%"
if %errorlevel% neq 0 (
    echo ❌ 建立資源群組失敗
    pause
    exit /b 1
)

REM 建立 App Service 方案
echo 📦 建立 App Service 方案...
az appservice plan create ^
    --name "%APP_NAME%-plan" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --location "%LOCATION%" ^
    --sku B1 ^
    --is-linux
if %errorlevel% neq 0 (
    echo ❌ 建立 App Service 方案失敗
    pause
    exit /b 1
)

REM 建立 Web App
echo 🌐 建立 Web App...
az webapp create ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --plan "%APP_NAME%-plan" ^
    --runtime "NODE|18-lts"
if %errorlevel% neq 0 (
    echo ❌ 建立 Web App 失敗
    pause
    exit /b 1
)

REM 啟用 WebSocket
echo ⚡ 啟用 WebSocket 支援...
az webapp config set ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --web-sockets-enabled true

REM 設定基本環境變數
echo 🔧 設定基本環境變數...
az webapp config appsettings set ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --settings ^
        NODE_ENV=production ^
        PORT=8080 ^
        WEBSITE_NODE_DEFAULT_VERSION=18-lts ^
        SCM_DO_BUILD_DURING_DEPLOYMENT=true

REM 建立部署套件
echo 📦 建立部署套件...
if exist "%APP_NAME%.zip" del "%APP_NAME%.zip"
powershell -Command "Compress-Archive -Path * -DestinationPath '%APP_NAME%.zip' -Force -CompressionLevel Optimal -Exclude @('node_modules', '.git', 'tests', '*.md')"

REM 部署應用程式
echo 🚚 部署應用程式...
az webapp deployment source config-zip ^
    --name "%APP_NAME%" ^
    --resource-group "%RESOURCE_GROUP%" ^
    --src "%APP_NAME%.zip"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo     ✅ 部署成功完成！
    echo ================================================
    echo.
    echo 🌐 您的應用程式 URL: https://%APP_NAME%.azurewebsites.net
    echo 📊 Azure Portal: https://portal.azure.com/
    echo.
    echo 📝 重要的後續步驟：
    echo.
    echo 1. 🔐 設定安全環境變數：
    echo    - JWT_SECRET (JWT 密鑰)
    echo    - ADMIN_USERNAME (管理員用戶名)
    echo    - INITIAL_STOCK_PRICE (初始股價)
    echo.
    echo 2. 🗃️  設定數據庫連線 (如果使用雲端數據庫)：
    echo    - Firestore 或 Cosmos DB 相關設定
    echo.
    echo 3. 📊 設定監控：
    echo    - 啟用 Application Insights
    echo    - 設定警示規則
    echo.
    echo 4. 🛡️  安全性設定：
    echo    - 設定自訂網域
    echo    - 啟用 SSL 憑證
    echo    - 設定 HTTPS 重新導向
    echo.
    echo 💡 設定環境變數的方法：
    echo    1. 前往 Azure Portal
    echo    2. 找到您的 App Service: %APP_NAME%
    echo    3. 左側選單 → Configuration
    echo    4. Application settings → New application setting
    echo.
    echo 📖 詳細指南請參考: azure-deployment-guide.md
    echo.
) else (
    echo ❌ 部署失敗，請檢查錯誤訊息
)

echo 🧹 清理暫存檔案...
if exist "%APP_NAME%.zip" del "%APP_NAME%.zip"

echo.
echo 感謝使用 Orange Trade Azure 部署嚮導！
pause 