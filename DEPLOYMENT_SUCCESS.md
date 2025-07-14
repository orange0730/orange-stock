# 🎉 Orange Trade 成功部署到 Google Cloud Run！

恭喜！您的虛擬股票交易系統已經成功部署到雲端。

## 部署資訊

| 項目 | 詳情 |
|------|------|
| **服務名稱** | orange-trade |
| **服務 URL** | https://orange-trade-1069330928314.us-central1.run.app |
| **專案 ID** | orange-stock-465916 |
| **地區** | us-central1 |
| **Docker 映像** | gcr.io/orange-stock-465916/orange-trade:latest |
| **部署時間** | 2025-07-15 |

## 重要連結

- **應用程式**: https://orange-trade-1069330928314.us-central1.run.app
- **Google Cloud Console**: https://console.cloud.google.com/run?project=orange-stock-465916
- **Cloud Run 日誌**: https://console.cloud.google.com/logs/query?project=orange-stock-465916

## 快速操作腳本

我已為您創建了以下便利腳本：

1. **check-deployment.bat** - 檢查部署狀態和查看日誌
2. **update-env-vars.bat** - 更新環境變量
3. **redeploy.bat** - 重新構建和部署應用

## 下一步建議

### 1. 測試應用功能
- 訪問應用 URL 並測試所有功能
- 確認登入、交易、即時更新等功能正常

### 2. 設置自定義域名（可選）
```bash
gcloud run domain-mappings create --service orange-trade --domain your-domain.com --region us-central1
```

### 3. 監控和維護
- 定期查看 Cloud Run 日誌
- 監控資源使用情況
- 設置預算警報

### 4. 資料庫持久化
目前使用的是 SQLite，在 Cloud Run 重啟時會遺失資料。建議：
- 升級到 Cloud SQL（PostgreSQL/MySQL）
- 或使用 Firebase Realtime Database
- 或掛載持久化存儲

## 費用預估

基於 Cloud Run 的定價模式：
- **請求費用**: $0.40 / 百萬請求
- **計算費用**: $0.000024 / vCPU-秒
- **記憶體費用**: $0.0000025 / GiB-秒

對於低到中等流量，每月費用通常在 $0-10 美元之間。

## 故障排除

如果遇到問題：

1. **查看日誌**：
   ```bash
   gcloud run logs tail orange-trade --region us-central1
   ```

2. **檢查服務狀態**：
   ```bash
   gcloud run services describe orange-trade --region us-central1
   ```

3. **更新部署**：
   執行 `redeploy.bat`

## 聯繫支援

如需協助，請查看：
- [Cloud Run 文檔](https://cloud.google.com/run/docs)
- [Google Cloud 支援](https://cloud.google.com/support)

---

🎊 再次恭喜您成功部署 Orange Trade！祝您使用愉快！