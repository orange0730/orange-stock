# Google Cloud Run 部署指南

## 🎉 部署成功！

**您的 Orange Trade 應用已成功部署到 Google Cloud Run！**

- **服務 URL**: https://orange-trade-1069330928314.us-central1.run.app
- **專案 ID**: orange-stock-465916
- **地區**: us-central1
- **狀態**: ✅ 運行中

### 快速操作指令：
- **查看狀態**: `check-deployment.bat`
- **更新環境變量**: `update-env-vars.bat`
- **重新部署**: `redeploy.bat`

---

## 第一步：安裝 Git (Windows)

### 方法 1：手動下載安裝
1. 前往 Git 官方網站：https://git-scm.com/download/win
2. 下載 64-bit Git for Windows Setup
3. 執行安裝程式，使用預設設定即可
4. 安裝完成後，重新開啟 PowerShell 或 Command Prompt
5. 驗證安裝：執行 `git --version`

### 方法 2：使用瀏覽器直接下載
直接下載連結：https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe

## 第二步：安裝 Google Cloud SDK

1. 下載 Google Cloud SDK：
   - 前往：https://cloud.google.com/sdk/docs/install
   - 選擇 Windows 版本
   - 下載並執行安裝程式

2. 安裝完成後，開啟新的 PowerShell 視窗

3. 初始化 gcloud：
   ```bash
   gcloud init
   ```

4. 登入您的 Google 帳號並選擇專案

## 第三步：準備部署

1. 確認您在專案目錄：
   ```bash
   cd D:\orange-trade
   ```

2. 初始化 Git 倉庫（如果尚未初始化）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. 創建 .gitignore 檔案：
   ```bash
   echo node_modules/ > .gitignore
   echo .env >> .gitignore
   echo *.db >> .gitignore
   echo .env.local >> .gitignore
   ```

## 第四步：建立 Docker 映像

1. 確保 Docker Desktop 已安裝並執行中
   - 下載：https://www.docker.com/products/docker-desktop/

2. 建立本地映像：
   ```bash
   docker build -t orange-trade .
   ```

3. 測試本地執行：
   ```bash
   docker run -p 3000:3000 orange-trade
   ```

## 第五步：部署到 Google Cloud Run

1. 啟用 Cloud Run API：
   ```bash
   gcloud services enable run.googleapis.com
   ```

2. 設定專案 ID（替換 YOUR-PROJECT-ID）：
   ```bash
   gcloud config set project YOUR-PROJECT-ID
   ```

3. 配置 Docker 使用 gcloud：
   ```bash
   gcloud auth configure-docker
   ```

4. 標記映像（替換 YOUR-PROJECT-ID）：
   ```bash
   docker tag orange-trade gcr.io/YOUR-PROJECT-ID/orange-trade
   ```

5. 推送映像到 Google Container Registry：
   ```bash
   docker push gcr.io/YOUR-PROJECT-ID/orange-trade
   ```

6. 部署到 Cloud Run：
   ```bash
   gcloud run deploy orange-trade \
     --image gcr.io/YOUR-PROJECT-ID/orange-trade \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars "NODE_ENV=production"
   ```

## 第六步：設定環境變數

1. 在 Google Cloud Console 中：
   - 前往 Cloud Run
   - 選擇您的服務
   - 點擊「編輯和部署新修訂版本」
   - 在「變數」標籤中添加環境變數

2. 或使用命令列：
   ```bash
   gcloud run services update orange-trade \
     --update-env-vars "JWT_SECRET=your-secret-key"
   ```

## 第七步：設定自訂網域（選用）

1. 在 Cloud Run 控制台中：
   - 選擇您的服務
   - 點擊「管理自訂網域」
   - 按照指示設定您的網域

## 常見問題

### 問題：無法推送映像
解決方案：
```bash
gcloud auth login
gcloud auth configure-docker
```

### 問題：部署失敗
檢查：
1. 確保 Dockerfile 正確
2. 檢查環境變數設定
3. 查看 Cloud Run 日誌：
   ```bash
   gcloud run logs read --service=orange-trade
   ```

### 問題：應用程式無法啟動
檢查：
1. PORT 環境變數是否正確使用
2. 資料庫檔案權限
3. 所有依賴項是否已安裝

## 費用估算

Google Cloud Run 免費額度：
- 每月 200 萬次請求
- 每月 360,000 GB-秒的記憶體
- 每月 180,000 vCPU-秒的 CPU

對於小型應用，通常可以保持在免費額度內。

## 監控和日誌

1. 查看日誌：
   ```bash
   gcloud run logs read --service=orange-trade --limit=50
   ```

2. 查看指標：
   在 Google Cloud Console 的 Cloud Run 頁面查看請求數、延遲等指標

## 更新部署

當您更新代碼後：
1. 重新建立映像
2. 推送到 Container Registry
3. Cloud Run 會自動部署新版本

或使用一鍵更新腳本：
```bash
docker build -t orange-trade .
docker tag orange-trade gcr.io/YOUR-PROJECT-ID/orange-trade
docker push gcr.io/YOUR-PROJECT-ID/orange-trade
gcloud run deploy orange-trade --image gcr.io/YOUR-PROJECT-ID/orange-trade
``` 