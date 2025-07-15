# 🚀 Azure Cosmos DB 快速設定指南

## 📋 前置準備

1. Azure 帳號（如果沒有，可以申請免費試用）
2. 已安裝 Node.js 和 npm
3. Google Cloud SDK（用於部署）

## 🔧 步驟 1：創建 Azure Cosmos DB

1. 登入 [Azure Portal](https://portal.azure.com)
2. 點擊「建立資源」→「資料庫」→「Azure Cosmos DB」
3. 選擇「核心 (SQL)」API
4. 填寫資訊：
   - 帳戶名稱：`orange-stock-db`（或您喜歡的名稱）
   - 地區：`East Asia`
   - 容量模式：選擇「佈建的輸送量」並勾選「套用免費層折扣」

## 🔑 步驟 2：取得連接資訊

1. 資源創建完成後，點擊進入
2. 左側選單 → 「金鑰」
3. 複製：
   - URI（例如：`https://orange-stock-db.documents.azure.com:443/`）
   - 主要金鑰

## ⚙️ 步驟 3：設定環境變數

創建 `.env` 檔案：

```bash
# Azure Cosmos DB
COSMOS_ENDPOINT=https://orange-stock-db.documents.azure.com:443/
COSMOS_KEY=your-primary-key-here
COSMOS_DATABASE=orange-stock
COSMOS_ENABLED=true
```

## 📦 步驟 4：安裝和測試

```bash
# 安裝依賴
npm install

# 測試連接
node test-cosmos.js

# 本地測試（使用 Cosmos DB）
npm start
```

## 🚀 步驟 5：部署到 Cloud Run

### 方法 A：使用批次檔案（Windows）

```bash
# 設定環境變數
set COSMOS_ENDPOINT=https://orange-stock-db.documents.azure.com:443/
set COSMOS_KEY=your-primary-key

# 執行部署
deploy-with-cosmos.bat
```

### 方法 B：手動部署

```bash
# 建構映像
docker build -t gcr.io/orange-stock-465916/orange-trade .

# 推送映像
docker push gcr.io/orange-stock-465916/orange-trade

# 部署服務
gcloud run deploy orange-trade \
  --image gcr.io/orange-stock-465916/orange-trade \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars COSMOS_ENABLED=true \
  --set-env-vars COSMOS_ENDPOINT=your-endpoint \
  --set-env-vars COSMOS_KEY=your-key \
  --set-env-vars COSMOS_DATABASE=orange-stock
```

## ✅ 驗證部署

1. 訪問：https://orange-trade-1069330928314.asia-east1.run.app
2. 測試功能：
   - 註冊新用戶
   - 登入
   - 執行交易
3. 重啟服務驗證資料持久性

## 💰 成本控制

- **免費層**：1000 RU/s + 25GB 永久免費
- **監控使用量**：Azure Portal → 指標
- **設定警示**：避免超出免費額度

## 🛠️ 故障排除

### 連接失敗
- 檢查端點和金鑰是否正確
- 確認防火牆規則允許連接

### 部署失敗
- 檢查環境變數是否正確設定
- 查看 Cloud Run 日誌

### 效能問題
- 檢查 RU 使用量
- 考慮增加輸送量或使用無伺服器模式

## 📞 需要協助？

如果遇到問題，請提供：
1. 錯誤訊息
2. Cloud Run 日誌
3. test-cosmos.js 的輸出結果 