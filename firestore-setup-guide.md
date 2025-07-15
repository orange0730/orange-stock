# 🔥 Google Firestore 設置指南

## 步驟 1：啟用 Firestore

1. 打開 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「創建專案」或選擇現有的 Google Cloud 專案
3. 專案 ID：`orange-stock-465916`
4. 在左側選單找到「Firestore Database」
5. 點擊「創建數據庫」
6. 選擇「生產模式」
7. 選擇位置：`us-central1`（與 Cloud Run 相同）

## 步驟 2：創建服務帳戶金鑰

1. 在 Firebase Console 中：
   - 點擊專案設定（齒輪圖標）
   - 選擇「服務帳戶」標籤
   - 點擊「生成新的私鑰」
   - 下載 JSON 檔案

2. 或在 [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=orange-stock-465916) 中：
   - 找到 Firebase Admin SDK 服務帳戶
   - 創建新的金鑰
   - 選擇 JSON 格式

## 步驟 3：設置環境變數

1. 將下載的 JSON 檔案重命名為 `firestore-key.json`
2. 將檔案放在專案根目錄
3. **重要**：確保 `.gitignore` 包含此檔案！

## 步驟 4：更新 Cloud Run 環境變數

執行以下指令設置環境變數：

```bash
# Windows
set-firestore-env.bat

# 或手動執行
gcloud run services update orange-trade --update-env-vars FIRESTORE_ENABLED=true --region us-central1
```

## 步驟 5：部署更新

```bash
deploy-firestore-update.bat
```

## Firestore 數據結構

### Collections:
- **users** - 用戶資料
  ```
  {
    id: string,
    username: string,
    email: string,
    password: string (hashed),
    points: number,
    shares: number,
    role: string,
    createdAt: timestamp
  }
  ```

- **transactions** - 交易記錄
  ```
  {
    id: string,
    userId: string,
    type: 'buy' | 'sell',
    quantity: number,
    price: number,
    totalValue: number,
    timestamp: timestamp
  }
  ```

- **stockHistory** - 股價歷史
  ```
  {
    id: string,
    price: number,
    volume: number,
    timestamp: timestamp
  }
  ```

- **limitOrders** - 限價訂單
  ```
  {
    id: string,
    userId: string,
    type: 'buy' | 'sell',
    targetPrice: number,
    quantity: number,
    status: 'pending' | 'executed' | 'cancelled',
    createdAt: timestamp
  }
  ```

- **settings** - 系統設定
  ```
  {
    currentPrice: number,
    openPrice: number,
    dayHigh: number,
    dayLow: number,
    totalVolume: number,
    priceImpactSettings: object
  }
  ```

## 費用預估

### 免費額度（每天）
- 50,000 次讀取
- 20,000 次寫入
- 20,000 次刪除
- 1 GB 儲存空間

### 預估使用量
- 小型應用（< 100 用戶）：完全免費
- 中型應用（100-1000 用戶）：約 $1-5/月
- 大型應用（> 1000 用戶）：約 $5-20/月

## 優勢

1. **自動擴展** - 無需管理伺服器
2. **即時同步** - 支援實時更新
3. **全球分佈** - 低延遲存取
4. **自動備份** - 數據永不丟失
5. **簡單整合** - Firebase SDK 易於使用

## 注意事項

1. **安全規則** - 初期使用服務帳戶，之後可設置細緻的安全規則
2. **索引** - 複雜查詢需要創建索引
3. **限制** - 單文檔大小限制 1MB
4. **計費** - 超出免費額度會產生費用

## 疑難排解

### 常見錯誤
1. **權限錯誤** - 確保服務帳戶有 Firestore 權限
2. **找不到憑證** - 檢查環境變數設置
3. **配額超限** - 檢查 Firebase Console 的使用量

### 檢查連接
```javascript
// 測試 Firestore 連接
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

db.collection('test').add({
    message: 'Hello Firestore!',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
}).then(() => {
    console.log('Firestore 連接成功！');
}).catch(error => {
    console.error('Firestore 連接失敗：', error);
});
``` 