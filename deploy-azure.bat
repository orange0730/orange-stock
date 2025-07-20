@echo off
chcp 65001 >nul
echo 🚀 開始部署 Orange Trade 到 Azure Web App...

REM 設定變數 - 請根據您的需求修改
set RESOURCE_GROUP=orange-trade-rg
set APP_SERVICE_PLAN=orange-trade-plan
set WEBAPP_NAME=orange-trade-app
set LOCATION="East Asia"
set NODE_VERSION=18-lts

echo 📋 使用的設定:
echo   資源群組: %RESOURCE_GROUP%
echo   App Service 方案: %APP_SERVICE_PLAN%
echo   Web App 名稱: %WEBAPP_NAME%
echo   位置: %LOCATION%
echo   Node.js 版本: %NODE_VERSION%
echo.

REM 建立資源群組
echo 🏗️  建立資源群組...
az group create --name %RESOURCE_GROUP% --location %LOCATION%

REM 建立 App Service 方案
echo 📦 建立 App Service 方案...
az appservice plan create ^
    --name %APP_SERVICE_PLAN% ^
    --resource-group %RESOURCE_GROUP% ^
    --location %LOCATION% ^
    --sku B1 ^
    --is-linux

REM 建立 Web App
echo 🌐 建立 Web App...
az webapp create ^
    --name %WEBAPP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --plan %APP_SERVICE_PLAN% ^
    --runtime "NODE|%NODE_VERSION%"

REM 設定 Web App 的設定
echo ⚙️  配置 Web App 設定...

REM 啟用 WebSocket
az webapp config set ^
    --name %WEBAPP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --web-sockets-enabled true

REM 設定啟動檔案
az webapp config set ^
    --name %WEBAPP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --startup-file "npm start"

REM 設定環境變數
echo 🔧 設定環境變數...
az webapp config appsettings set ^
    --name %WEBAPP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --settings ^
        NODE_ENV=production ^
        PORT=8080 ^
        WEBSITE_NODE_DEFAULT_VERSION=%NODE_VERSION%

echo 📝 請手動設定以下環境變數：
echo   - JWT_SECRET (JWT 密鑰)
echo   - ADMIN_USERNAME (管理員用戶名)
echo   - INITIAL_STOCK_PRICE (初始股價)
echo   - 其他數據庫相關設定
echo.

REM 建立部署套件
echo 📦 建立部署套件...
if exist orange-trade.zip del orange-trade.zip
powershell -Command "Compress-Archive -Path *, -DestinationPath orange-trade.zip -Force -CompressionLevel Optimal"

REM 部署程式碼
echo 🚚 部署程式碼...
az webapp deployment source config-zip ^
    --name %WEBAPP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --src orange-trade.zip

echo ✅ 部署完成！
echo 🌐 Web App URL: https://%WEBAPP_NAME%.azurewebsites.net
echo.
echo 🔗 有用的連結：
echo   - Azure Portal: https://portal.azure.com/
echo   - 應用程式日誌: https://portal.azure.com/
echo.
echo 📚 後續步驟：
echo   1. 在 Azure Portal 中設定環境變數
echo   2. 設定自訂網域 (可選)
echo   3. 啟用 SSL 憑證
echo   4. 設定監控和警示

pause 