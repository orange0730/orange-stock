# Google Cloud Console 快速連結

## 您的 Orange Trade 部署位置

### 1. Cloud Run 服務（主要）
直接查看您的應用：
https://console.cloud.google.com/run/detail/us-central1/orange-trade/metrics?project=orange-stock-465916

### 2. Cloud Run 服務列表
查看所有 Cloud Run 服務：
https://console.cloud.google.com/run?project=orange-stock-465916

### 3. Container Registry（Docker 映像）
查看您的 Docker 映像：
https://console.cloud.google.com/gcr/images/orange-stock-465916?project=orange-stock-465916

### 4. Cloud Build 歷史
查看構建記錄：
https://console.cloud.google.com/cloud-build/builds?project=orange-stock-465916

### 5. 日誌檢視器
查看應用日誌：
https://console.cloud.google.com/logs/query?project=orange-stock-465916&query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22orange-trade%22

### 6. 專案儀表板
專案總覽：
https://console.cloud.google.com/home/dashboard?project=orange-stock-465916

### 7. 計費和用量
查看費用：
https://console.cloud.google.com/billing/linkedaccount?project=orange-stock-465916