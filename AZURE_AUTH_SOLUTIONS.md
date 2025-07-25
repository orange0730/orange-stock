#  Azure 部署認證解決方案

##  問題：已停用基本驗證

Azure App Service 已停用基本驗證，無法下載發布設定檔。

##  解決方案

### 方案 1: 啟用基本驗證（最簡單）

1. **Azure Portal**  您的 Web App (orange-trade)
2. **部署中心**  **FTPS 認證**
3. **啟用基本驗證**
4. **儲存**  **下載發布設定檔**

完成後按照之前的 GitHub Secret 設定即可。

### 方案 2: 使用 Service Principal（更安全）

1. **建立 Service Principal**：參考 AZURE_SERVICE_PRINCIPAL_SETUP.md
2. **使用新工作流程**：azure-deploy-sp.yml
3. **設定 GitHub Secrets**：
   - AZURE_CREDENTIALS (JSON 格式)

##  推薦流程

**對於快速測試**: 選擇方案 1
**對於生產環境**: 選擇方案 2

##  相關文件

- AZURE_SERVICE_PRINCIPAL_SETUP.md - Service Principal 詳細設定
- azure-deploy-sp.yml - Service Principal 工作流程
- GITHUB_AZURE_SETUP.md - 原始設定指南
