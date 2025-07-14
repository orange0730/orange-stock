# 🚀 Orange Trade 雲端部署指南

本指南將幫助您將 Orange Trade 應用程式部署到各種雲端平台。

## 📋 部署前準備

1. **確保您的代碼已推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/orange-trade.git
   git push -u origin main
   ```

2. **環境變數設置**
   - `JWT_SECRET`: 用於認證的密鑰（請使用安全的隨機字符串）
   - `NODE_ENV`: 設為 `production`

## 🚂 選項 1：Railway（推薦）

Railway 是最簡單的部署方式，特別適合 SQLite 應用。

### 步驟：

1. **註冊 Railway**
   - 訪問 [railway.app](https://railway.app)
   - 使用 GitHub 帳號登入

2. **部署應用**
   ```bash
   # 安裝 Railway CLI
   npm install -g @railway/cli
   
   # 登入
   railway login
   
   # 初始化專案
   railway init
   
   # 部署
   railway up
   ```

3. **設置環境變數**
   ```bash
   railway variables set JWT_SECRET=your_secure_secret_here
   railway variables set NODE_ENV=production
   ```

4. **設置持久化存儲**
   - Railway 會自動為 `/app/data` 目錄提供持久化存儲

## 🌊 選項 2：Render

Render 提供免費方案，適合小型應用。

### 步驟：

1. **創建 render.yaml**
   ```yaml
   services:
     - type: web
       name: orange-trade
       env: docker
       dockerfilePath: ./Dockerfile
       envVars:
         - key: JWT_SECRET
           generateValue: true
         - key: NODE_ENV
           value: production
       disk:
         name: orange-data
         mountPath: /app/data
         sizeGB: 1
   ```

2. **部署到 Render**
   - 訪問 [render.com](https://render.com)
   - 連接 GitHub 倉庫
   - 選擇 "New Web Service"
   - 選擇您的倉庫並部署

## ☁️ 選項 3：Google Cloud Run

適合需要自動擴展的應用。

### 步驟：

1. **安裝 Google Cloud SDK**
   ```bash
   # 下載並安裝 gcloud CLI
   # https://cloud.google.com/sdk/docs/install
   ```

2. **初始化並部署**
   ```bash
   # 初始化 gcloud
   gcloud init
   
   # 設置專案
   gcloud config set project YOUR_PROJECT_ID
   
   # 啟用必要的 API
   gcloud services enable run.googleapis.com
   
   # 構建並推送映像
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/orange-trade
   
   # 部署到 Cloud Run
   gcloud run deploy orange-trade \
     --image gcr.io/YOUR_PROJECT_ID/orange-trade \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated \
     --set-env-vars JWT_SECRET=your_secret_here,NODE_ENV=production
   ```

## 🔷 選項 4：Azure Container Instances

微軟 Azure 的容器服務。

### 步驟：

1. **安裝 Azure CLI**
   ```bash
   # 安裝 Azure CLI
   # https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   ```

2. **部署步驟**
   ```bash
   # 登入 Azure
   az login
   
   # 創建資源組
   az group create --name orangeTradeRG --location eastasia
   
   # 創建容器註冊表
   az acr create --resource-group orangeTradeRG \
     --name orangetradeacr --sku Basic
   
   # 構建並推送映像
   az acr build --registry orangetradeacr \
     --image orange-trade .
   
   # 部署容器
   az container create \
     --resource-group orangeTradeRG \
     --name orange-trade \
     --image orangetradeacr.azurecr.io/orange-trade:latest \
     --dns-name-label orange-trade \
     --ports 3000 \
     --environment-variables JWT_SECRET=your_secret NODE_ENV=production
   ```

## 🚢 選項 5：使用 Docker Hub + VPS

如果您有自己的 VPS（如 DigitalOcean、Linode）。

### 步驟：

1. **推送到 Docker Hub**
   ```bash
   # 登入 Docker Hub
   docker login
   
   # 構建映像
   docker build -t YOUR_USERNAME/orange-trade .
   
   # 推送映像
   docker push YOUR_USERNAME/orange-trade
   ```

2. **在 VPS 上部署**
   ```bash
   # SSH 到您的 VPS
   ssh user@your-vps-ip
   
   # 安裝 Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # 運行應用
   docker run -d \
     --name orange-trade \
     -p 80:3000 \
     -v orange_data:/app/data \
     -e JWT_SECRET=your_secret \
     -e NODE_ENV=production \
     --restart unless-stopped \
     YOUR_USERNAME/orange-trade
   ```

## 🔐 安全建議

1. **環境變數**
   - 永遠不要將 JWT_SECRET 硬編碼在代碼中
   - 使用強密碼（至少 32 個字符）

2. **HTTPS**
   - 所有雲端平台都提供免費 SSL 證書
   - 確保啟用 HTTPS

3. **備份**
   - 定期備份 SQLite 數據庫
   - 可以設置自動備份腳本

## 📊 監控和日誌

1. **Railway**
   - 內建日誌查看器
   - 可以使用 `railway logs` 命令

2. **Render**
   - Dashboard 中查看日誌
   - 支援日誌導出

3. **Google Cloud Run**
   - Cloud Logging 自動收集日誌
   - 可設置警報

## 🆘 常見問題

### Q: SQLite 在雲端安全嗎？
A: 對於中小型應用是安全的。確保：
- 使用持久化存儲
- 定期備份
- 單一實例部署（避免並發寫入問題）

### Q: 需要遷移到其他數據庫嗎？
A: 當您需要以下功能時考慮遷移：
- 多實例擴展
- 高並發寫入
- 分布式部署

### Q: 如何處理文件上傳？
A: 使用雲端存儲服務：
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## 📞 需要幫助？

如果在部署過程中遇到問題，可以：
1. 查看平台的官方文檔
2. 檢查應用日誌
3. 確保所有環境變數都已正確設置

祝您部署順利！🎉 