# 🔥 快速設置 Firestore - 3 步驟

## 步驟 1：開啟 Firebase Console

1. 點擊這個連結：[Firebase Console](https://console.firebase.google.com/)
2. 用您的 Google 帳號登入
3. 您應該會看到 `orange-stock-465916` 專案（如果沒有，點擊「新增專案」並輸入這個 ID）

## 步驟 2：啟用 Firestore

在 Firebase Console 中：
1. 左側選單找到「Firestore Database」（資料庫圖標）
2. 點擊「建立資料庫」
3. 選擇「生產模式」
4. 位置選擇「us-central1」
5. 點擊「啟用」

## 步驟 3：下載金鑰並執行設置

1. 在 Firebase Console：
   - 點擊專案設定（齒輪圖標）
   - 選擇「服務帳戶」
   - 點擊「產生新的私密金鑰」
   - 下載 JSON 檔案

2. 重要：將下載的檔案重命名為 `firestore-key.json`

3. 將 `firestore-key.json` 放在專案根目錄（和 package.json 同一層）

4. 執行設置腳本：
   ```bash
   enable-firestore.bat
   ```

## 完成！

設置完成後，您的資料將永久保存在 Google Firestore 中，不會再因為重啟而消失。

### 測試是否成功
```bash
test-firestore.bat
```

### 部署更新
```bash
deploy-firestore-update.bat
```

## 常見問題

**Q: 要付費嗎？**
A: Firestore 有充足的免費額度，小型應用通常完全免費。

**Q: 如果看到權限錯誤？**
A: 確認您下載的是正確專案的金鑰檔案。

**Q: 如何知道是否在使用 Firestore？**
A: 重啟應用後如果資料還在，就表示成功了！ 