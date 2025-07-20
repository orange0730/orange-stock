# 🚀 Google Firestore 快速設定指南

## 📋 前置準備

1. Google Cloud 帳號
2. 已安裝 Node.js 和 npm
3. Google Cloud SDK
4. 已有 `firestore-key.json` 服務帳戶金鑰

## ✅ 您已經有的資源

根據您的 `firestore-key.json`：
- 專案 ID：`orange-stock-a65bb`
- 服務帳戶：`firebase-adminsdk-fbsvc@orange-stock-a65bb.iam.gserviceaccount.com`

## 🔧 步驟 1：測試本地連接

```bash
# 測試 Firestore 連接
node test-firestore.js

# 或使用批次檔案
enable-firestore.bat
```

## ⚙️ 步驟 2：設定環境變數

創建或更新 `.env` 檔案：

```bash
# Google Firestore
FIRESTORE_ENABLED=true
FIRESTORE_KEY_PATH=./firestore-key.json
FIRESTORE_PROJECT_ID=orange-stock-465916
```

## 📦 步驟 3：安裝依賴（已包含在 package.json）

```bash
npm install
```

## 🚀 步驟 4：部署到 Cloud Run

### 方法 A：使用批次檔案（推薦）

```bash
deploy-with-firestore.bat
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
  --set-env-vars FIRESTORE_ENABLED=true \
  --set-env-vars FIRESTORE_PROJECT_ID=orange-stock-465916 \
  --set-env-vars FIRESTORE_KEY_PATH=./firestore-key.json
```

## ✅ 驗證部署

1. 訪問：https://orange-trade-1069330928314.asia-east1.run.app
2. 測試功能：
   - 註冊新用戶
   - 登入
   - 執行交易
3. 檢查 Firebase Console 確認資料已儲存

## 💾 資料結構

Firestore 集合：
- `users` - 用戶資料
- `transactions` - 交易記錄
- `stockHistory` - 股價歷史
- `limitOrders` - 限價單

## 🛠️ 故障排除

### 連接失敗
1. 確認 `firestore-key.json` 存在且正確
2. 檢查專案 ID 是否正確
3. 確認 Firestore 已在 Firebase Console 啟用

### 權限錯誤
1. 確認服務帳戶有 Firestore 權限
2. 在 Firebase Console 檢查安全規則

### 部署失敗
1. 確認 Docker 映像包含 `firestore-key.json`
2. 檢查環境變數是否正確設定
3. 查看 Cloud Run 日誌

## 📊 監控和管理

1. **Firebase Console**：查看即時資料
   - https://console.firebase.google.com
   
2. **Cloud Run 日誌**：監控應用程式
   - https://console.cloud.google.com/run

3. **使用量監控**：
   - Firestore 免費額度：50K 讀取/20K 寫入/20K 刪除 每日
   - 超出後計費

## 🎉 完成！

您的應用程式現在使用 Google Firestore 作為持久化儲存，資料不會因為重啟而遺失。 