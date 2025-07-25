#  GitHub Actions Azure 部署設定指南

## 步驟 1: 下載 Azure 發布設定檔

1. **前往 Azure Portal**  您的 Web App (orange-trade)
2. **概觀頁面**  點擊 **"取得發行設定檔"** (Get publish profile)
3. **下載文件**: `orange-trade.PublishSettings`
4. **用文字編輯器開啟此文件**

## 步驟 2: 在 GitHub 設定 Secret

1. **前往 GitHub 存儲庫**: https://github.com/orange0730/orange-stock
2. **Settings**  **Secrets and variables**  **Actions**
3. **點擊 "New repository secret"**
4. **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. **Value**: 複製整個 .PublishSettings 文件的內容並貼上
6. **點擊 "Add secret"**

## 步驟 3: 觸發部署

設定完成後，有兩種方式觸發部署：

### 方式 A: 推送程式碼
```bash
git add .
git commit -m "修復 Azure 部署設定"
git push main master
```

### 方式 B: 手動觸發
1. 前往 GitHub  Actions 頁面
2. 選擇 "構建和部署 Node.js 應用程式到 Azure Web App"
3. 點擊 "Run workflow"

## 步驟 4: 監控部署

- **GitHub Actions**: https://github.com/orange0730/orange-stock/actions
- **Azure Portal**: 您的 Web App  部署中心

## 故障排解

如果部署失敗：
1. 檢查 GitHub Actions 日誌
2. 確認 secret 設定正確
3. 檢查 Azure Portal 中的應用程式日誌

完成這些步驟後，每次推送到 master 分支都會自動部署到 Azure！
