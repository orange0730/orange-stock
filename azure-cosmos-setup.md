# 🚀 Azure Cosmos DB 設定指南

## 步驟 1：在 Azure Portal 創建 Cosmos DB

1. 登入 [Azure Portal](https://portal.azure.com)
2. 點擊「建立資源」→「資料庫」→「Azure Cosmos DB」
3. 選擇「核心 (SQL)」API
4. 填寫基本資訊：
   - 訂用帳戶：選擇您的訂用帳戶
   - 資源群組：建立新的（例如：orange-stock-rg）
   - 帳戶名稱：orange-stock-db
   - 地區：East Asia（最接近台灣）
   - 容量模式：選擇「無伺服器」（更經濟）或「佈建的輸送量」（免費層）
5. 檢閱並建立

## 步驟 2：取得連接資訊

1. 資源建立完成後，前往資源
2. 在左側選單中，點擊「金鑰」
3. 複製以下資訊：
   - URI（端點）
   - 主要金鑰

## 步驟 3：設定環境變數

創建 `.env` 檔案（如果還沒有）並添加：

```bash
# Azure Cosmos DB Settings
COSMOS_ENABLED=true
COSMOS_ENDPOINT=https://orange-stock-db.documents.azure.com:443/
COSMOS_KEY=your-primary-key-here
COSMOS_DATABASE=orange-stock
```

## 步驟 4：安裝依賴

```bash
npm install @azure/cosmos
```

## 步驟 5：啟用 Cosmos DB

### 選項 A：修改 server.js（推薦）

在 server.js 開頭添加：

```javascript
// 初始化 Cosmos DB
const { initCosmosDB } = require('./database/cosmos-db');

// 在 app.listen 之前添加
async function startServer() {
    // 初始化 Cosmos DB
    if (process.env.COSMOS_ENABLED === 'true') {
        await initCosmosDB();
    }
    
    // 啟動伺服器
    app.listen(PORT, () => {
        console.log(`伺服器運行在 http://localhost:${PORT}`);
    });
}

startServer();
```

### 選項 B：使用切換腳本

```bash
# Windows
set COSMOS_ENABLED=true && npm start

# Mac/Linux
COSMOS_ENABLED=true npm start
```

## 步驟 6：部署到 Google Cloud Run

1. 在 Google Cloud Console 中設定環境變數：
   ```bash
   gcloud run services update orange-trade \
     --update-env-vars COSMOS_ENABLED=true \
     --update-env-vars COSMOS_ENDPOINT=your-endpoint \
     --update-env-vars COSMOS_KEY=your-key \
     --update-env-vars COSMOS_DATABASE=orange-stock \
     --region asia-east1
   ```

2. 或使用 Cloud Console UI：
   - 前往 Cloud Run
   - 選擇您的服務
   - 點擊「編輯和部署新的修訂版本」
   - 在「變數和密鑰」中添加環境變數

## 測試連接

創建 `test-cosmos.js`：

```javascript
require('dotenv').config();
const { initCosmosDB } = require('./database/cosmos-db');

async function test() {
    console.log('測試 Cosmos DB 連接...');
    const success = await initCosmosDB();
    if (success) {
        console.log('✅ Cosmos DB 連接成功！');
    } else {
        console.log('❌ Cosmos DB 連接失敗');
    }
    process.exit(0);
}

test();
```

執行測試：
```bash
node test-cosmos.js
```

## 成本預估

- **無伺服器模式**：
  - 只在使用時付費
  - 適合低流量應用
  - 預估成本：< $5/月

- **佈建輸送量（免費層）**：
  - 1000 RU/s 免費
  - 25GB 儲存免費
  - 永久免費
  - 適合小型應用

## 常見問題

### Q：如何選擇容量模式？
A：對於小型應用，選擇「佈建的輸送量」並使用免費層。對於流量不穩定的應用，選擇「無伺服器」。

### Q：需要備份嗎？
A：Cosmos DB 自動提供備份，無需額外設定。

### Q：如何監控使用量？
A：在 Azure Portal 中查看「指標」頁面，可以看到 RU 使用量和儲存空間。

## 下一步

1. 確認 Cosmos DB 已創建並運行
2. 設定環境變數
3. 部署更新的應用程式
4. 測試註冊和登入功能

需要協助嗎？請告訴我您遇到的問題！ 