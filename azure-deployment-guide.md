# Azure Web App 部署指南

## 📋 概述

本指南將協助您將 Orange Trade 應用程式部署到 Azure Web App。我們提供了多種部署方式供您選擇。

## 🛠️ 前置需求

1. **Azure 帳戶**: 確保您有有效的 Azure 訂閱
2. **Azure CLI**: 安裝最新版本的 Azure CLI
3. **Git**: 如果使用 GitHub Actions 部署
4. **Node.js 18.x**: 本機開發和測試

## 🚀 部署方式

### 方式 1: 使用部署腳本 (推薦)

#### Windows 用戶
```cmd
# 1. 登入 Azure CLI
az login

# 2. 執行部署腳本
.\deploy-azure.bat
```

#### macOS/Linux 用戶
```bash
# 1. 登入 Azure CLI
az login

# 2. 賦予執行權限並執行腳本
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### 方式 2: GitHub Actions 自動部署

1. **Fork 此存儲庫**到您的 GitHub 帳戶

2. **在 Azure Portal 中獲取發佈設定檔**:
   - 前往 Azure Portal > App Services > 您的應用程式
   - 點擊 "Get publish profile" 下載設定檔
   - 複製文件內容

3. **設定 GitHub Secrets**:
   - 前往 GitHub 存儲庫 > Settings > Secrets and variables > Actions
   - 新增 Secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - 貼上發佈設定檔內容

4. **修改工作流程文件**:
   - 編輯 `.github/workflows/azure-webapps-node.yml`
   - 更新 `AZURE_WEBAPP_NAME` 為您的應用程式名稱

5. **推送到 main/master 分支**即可自動部署

### 方式 3: 手動部署

```bash
# 1. 建立資源群組
az group create --name orange-trade-rg --location "East Asia"

# 2. 建立 App Service 方案
az appservice plan create \
    --name orange-trade-plan \
    --resource-group orange-trade-rg \
    --location "East Asia" \
    --sku B1 \
    --is-linux

# 3. 建立 Web App
az webapp create \
    --name your-app-name \
    --resource-group orange-trade-rg \
    --plan orange-trade-plan \
    --runtime "NODE|18-lts"

# 4. 部署程式碼
az webapp deployment source config-zip \
    --name your-app-name \
    --resource-group orange-trade-rg \
    --src orange-trade.zip
```

## ⚙️ 環境變數設定

部署後，請在 Azure Portal 中設定以下環境變數：

### 必要設定
- `NODE_ENV`: `production`
- `PORT`: `8080` (Azure Web App 預設)
- `JWT_SECRET`: 您的 JWT 密鑰 (請生成安全的隨機字符串)
- `ADMIN_USERNAME`: 管理員用戶名
- `INITIAL_STOCK_PRICE`: 初始股價

### 數據庫設定 (根據使用的數據庫選擇)

#### 使用 Firestore
- `FIREBASE_PROJECT_ID`: Firebase 專案 ID
- `FIREBASE_PRIVATE_KEY`: Firebase 私鑰
- `FIREBASE_CLIENT_EMAIL`: Firebase 客戶端電子信箱

#### 使用 Cosmos DB
- `COSMOS_DB_ENDPOINT`: Cosmos DB 端點
- `COSMOS_DB_KEY`: Cosmos DB 主鑰
- `COSMOS_DB_DATABASE_ID`: 數據庫 ID
- `COSMOS_DB_CONTAINER_ID`: 容器 ID

### 設定環境變數的步驟

1. 前往 Azure Portal
2. 導航到您的 App Service
3. 左側選單選擇 "Configuration"
4. 在 "Application settings" 分頁添加環境變數
5. 點擊 "Save" 儲存設定

## 🔧 後部署配置

### 1. 啟用 WebSocket (Socket.IO 支援)
```bash
az webapp config set \
    --name your-app-name \
    --resource-group orange-trade-rg \
    --web-sockets-enabled true
```

### 2. 設定自訂網域 (可選)
1. 在 Azure Portal 中前往您的 App Service
2. 選擇 "Custom domains"
3. 按照指示添加您的網域

### 3. 啟用 SSL 憑證
1. 在 "TLS/SSL settings" 中啟用 "HTTPS Only"
2. 為自訂網域新增 SSL 憑證

## 📊 監控和診斷

### 檢視應用程式日誌
```bash
# 即時日誌串流
az webapp log tail --name your-app-name --resource-group orange-trade-rg

# 下載日誌檔案
az webapp log download --name your-app-name --resource-group orange-trade-rg
```

### 在 Azure Portal 中監控
1. 前往您的 App Service
2. 選擇 "Log stream" 查看即時日誌
3. 選擇 "Metrics" 查看效能指標
4. 設定 "Alerts" 以在出現問題時收到通知

## 🐛 常見問題排解

### 1. 應用程式無法啟動
- 檢查 Node.js 版本是否正確 (18.x)
- 確認 `package.json` 中的 `start` 腳本正確
- 檢查環境變數是否正確設定

### 2. Socket.IO 連線問題
- 確認已啟用 WebSocket
- 檢查 CORS 設定
- 確認防火牆規則

### 3. 數據庫連線問題
- 驗證數據庫連線字符串
- 檢查防火牆規則
- 確認數據庫服務正在運行

### 4. 效能問題
- 升級到更高的 App Service 方案
- 啟用 Application Insights
- 檢查記憶體和 CPU 使用量

## 💡 最佳實踐

1. **使用生產環境設定**: 確保 `NODE_ENV=production`
2. **定期備份**: 設定自動備份
3. **監控設定**: 配置警示和監控
4. **安全性**: 使用強密碼和 HTTPS
5. **自動部署**: 使用 GitHub Actions 進行持續部署

## 🔗 有用的連結

- [Azure App Service 文件](https://docs.microsoft.com/azure/app-service/)
- [Node.js 部署指南](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure CLI 參考](https://docs.microsoft.com/cli/azure/webapp)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## 💬 支援

如果您遇到任何問題，請查看：
1. Azure Portal 中的應用程式日誌
2. GitHub Actions 的建置日誌
3. Azure 文件和社群論壇 