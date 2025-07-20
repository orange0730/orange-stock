# 🚀 一鍵部署到 Azure

## 方式 1: 使用 Deploy to Azure 按鈕

點擊下方按鈕直接在瀏覽器中部署：

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2F[YOUR-USERNAME]%2F[YOUR-REPO-NAME]%2Fmaster%2Fazuredeploy.json)

## 方式 2: 手動上傳模板

1. 前往 [Azure Portal](https://portal.azure.com/)
2. 搜尋 "Deploy a custom template"
3. 選擇 "Build your own template in the editor"
4. 複製 `azuredeploy.json` 的內容並貼上
5. 點擊 "Save"
6. 填入必要參數：
   - **App Name**: 您的應用程式名稱 (必須全球唯一)
   - **JWT Secret**: 安全的 JWT 密鑰
   - **Admin Username**: 管理員用戶名
   - **Initial Stock Price**: 初始股價
7. 點擊 "Review + create" 然後 "Create"

## 📦 部署後步驟

### 1. 上傳程式碼
使用以下方式之一上傳您的程式碼：

#### 方式 A: 使用 Git 部署
```bash
# 在您的專案目錄中
git remote add azure https://[APP-NAME].scm.azurewebsites.net:443/[APP-NAME].git
git push azure master
```

#### 方式 B: 使用 ZIP 部署
1. 將專案打包成 ZIP 檔案（排除 node_modules）
2. 在 Azure Portal 中前往您的 App Service
3. 左側選單選擇 "Deployment Center"
4. 選擇 "ZIP Deploy"
5. 上傳 ZIP 檔案

#### 方式 C: 使用 FTP 部署
1. 在 Azure Portal 中前往您的 App Service
2. 左側選單選擇 "Deployment Center"
3. 選擇 "FTP" 查看 FTP 憑證
4. 使用 FTP 客戶端上傳檔案

### 2. 驗證部署
部署完成後，前往您的應用程式 URL：
`https://[YOUR-APP-NAME].azurewebsites.net`

### 3. 監控和日誌
- **即時日誌**: App Service → Log stream
- **效能監控**: Application Insights (已自動配置)
- **診斷**: App Service → Diagnose and solve problems

## ⚙️ 重要設定說明

### 已自動配置的功能
- ✅ Node.js 18 LTS 運行時
- ✅ WebSocket 支援 (Socket.IO)
- ✅ HTTPS 強制重定向
- ✅ Application Insights 監控
- ✅ 環境變數設定
- ✅ 自動構建和部署

### 環境變數
以下環境變數已通過模板自動設定：
- `NODE_ENV=production`
- `PORT=8080`
- `JWT_SECRET` (您提供的值)
- `ADMIN_USERNAME` (您提供的值)
- `INITIAL_STOCK_PRICE` (您提供的值)

### 可選的後續配置
1. **自訂網域**: App Service → Custom domains
2. **SSL 憑證**: App Service → TLS/SSL settings  
3. **備份**: App Service → Backups
4. **縮放**: App Service → Scale up/Scale out

## 🔧 故障排解

### 常見問題
1. **應用程式無法啟動**
   - 檢查 Log stream 中的錯誤訊息
   - 確認 package.json 中的 start 腳本正確

2. **數據庫連線問題**
   - 如果使用雲端數據庫，請在 Configuration 中添加相關環境變數

3. **靜態檔案無法載入**
   - 檢查 public 目錄是否正確上傳
   - 確認 express.static 設定正確

### 獲取支援
- Azure Portal 中的 "Help + support"
- [Azure 文件](https://docs.microsoft.com/azure/app-service/)
- [GitHub Issues](https://github.com/[YOUR-USERNAME]/[YOUR-REPO-NAME]/issues)

## 💰 費用說明

使用的 Azure 服務：
- **App Service (Basic B1)**: 約 $13.14/月
- **Application Insights**: 前 5GB 免費，之後 $2.30/GB
- **估計總費用**: 約 $15-20/月 (視使用量而定)

您可以隨時在 Azure Portal 中監控和調整資源以控制費用。 