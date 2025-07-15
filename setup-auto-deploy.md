# 設置 GitHub 自動部署到 Google Cloud Run

## 方案一：使用 Cloud Build 觸發器（推薦）

### 步驟 1：連接 GitHub 儲存庫

1. 開啟 [Cloud Build 觸發器頁面](https://console.cloud.google.com/cloud-build/triggers?project=orange-stock-465916)

2. 點擊「連接存放區」

3. 選擇「GitHub」，然後授權 Google Cloud 存取您的 GitHub

4. 選擇您的 `orange-trade` 儲存庫

### 步驟 2：創建觸發器

1. 點擊「建立觸發器」

2. 設定以下選項：
   - **名稱**：`auto-deploy-orange-trade`
   - **事件**：推送至分支
   - **來源**：選擇您的儲存庫
   - **分支**：`^master$` 或 `^main$`（根據您的主分支名稱）
   - **建構設定**：Cloud Build 設定檔
   - **Cloud Build 設定檔位置**：`/cloudbuild.yaml`

3. 點擊「建立」

### 步驟 3：創建 cloudbuild.yaml

在專案根目錄創建 `cloudbuild.yaml`：

```yaml
steps:
  # 建構 Docker 映像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/orange-trade', '.']
  
  # 推送映像到 Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/orange-trade']
  
  # 部署到 Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'orange-trade'
      - '--image'
      - 'gcr.io/$PROJECT_ID/orange-trade'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

# 設定映像
images:
  - 'gcr.io/$PROJECT_ID/orange-trade'
```

## 方案二：使用 GitHub Actions

### 步驟 1：創建服務帳戶金鑰

1. 開啟 [服務帳戶頁面](https://console.cloud.google.com/iam-admin/serviceaccounts?project=orange-stock-465916)

2. 找到您的服務帳戶（應該有 Cloud Build 和 Cloud Run 權限）

3. 點擊「金鑰」→「新增金鑰」→「JSON」

4. 下載金鑰檔案

### 步驟 2：設定 GitHub Secrets

1. 在您的 GitHub 儲存庫，前往 Settings → Secrets and variables → Actions

2. 新增以下 secrets：
   - `GCP_PROJECT_ID`：`orange-stock-465916`
   - `GCP_SA_KEY`：貼上下載的 JSON 金鑰內容

### 步驟 3：創建 GitHub Actions 工作流程

創建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [ master, main ]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE: orange-trade
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}

    - name: Authorize Docker push
      run: gcloud auth configure-docker

    - name: Build Docker image
      run: docker build -t gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA .

    - name: Push Docker image
      run: docker push gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy $SERVICE \
          --image gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA \
          --platform managed \
          --region $REGION \
          --allow-unauthenticated
```

## 測試自動部署

設置完成後，只要執行：

```bash
git add .
git commit -m "測試自動部署"
git push origin master
```

就會自動觸發部署流程！

## 查看部署狀態

### Cloud Build 觸發器：
- [查看建構歷程](https://console.cloud.google.com/cloud-build/builds?project=orange-stock-465916)

### GitHub Actions：
- 在 GitHub 儲存庫的 Actions 標籤查看

## 注意事項

1. **首次設置**可能需要確保服務帳戶有足夠權限
2. **建構時間**通常需要 2-5 分鐘
3. **費用**：Cloud Build 每天有免費額度，通常足夠個人專案使用 