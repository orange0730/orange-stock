#!/bin/bash

# Google Cloud Run 部署腳本
# 使用前請確保已安裝 gcloud CLI 並已登入

# 設定變數
PROJECT_ID=""
SERVICE_NAME="orange-trade"
REGION="asia-east1"
IMAGE_NAME="orange-trade"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Orange Trade Google Cloud Run 部署腳本 ===${NC}"
echo

# 檢查是否已設定專案 ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}請輸入您的 Google Cloud 專案 ID:${NC}"
    read PROJECT_ID
fi

# 設定專案
echo -e "${GREEN}設定 Google Cloud 專案...${NC}"
gcloud config set project $PROJECT_ID

# 啟用必要的 API
echo -e "${GREEN}啟用 Cloud Run 和 Container Registry API...${NC}"
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# 配置 Docker 認證
echo -e "${GREEN}配置 Docker 認證...${NC}"
gcloud auth configure-docker

# 建立 Docker 映像
echo -e "${GREEN}建立 Docker 映像...${NC}"
docker build -t $IMAGE_NAME .

# 標記映像
echo -e "${GREEN}標記映像...${NC}"
docker tag $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME

# 推送映像到 Container Registry
echo -e "${GREEN}推送映像到 Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME

# 部署到 Cloud Run
echo -e "${GREEN}部署到 Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3000 \
    --memory 512Mi \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,JWT_SECRET=$(openssl rand -base64 32)"

# 獲取服務 URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo
echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo -e "${GREEN}您的應用程式現在可以在以下網址訪問：${NC}"
echo -e "${YELLOW}$SERVICE_URL${NC}"
echo
echo -e "${GREEN}提示：${NC}"
echo "1. 首次訪問可能需要幾秒鐘來啟動容器"
echo "2. 使用 'gcloud run logs read --service=$SERVICE_NAME' 查看日誌"
echo "3. 使用 'gcloud run services update $SERVICE_NAME' 更新環境變數" 