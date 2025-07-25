#  Azure Web App ZIP 部署指南

## 方案：直接 ZIP 部署（最簡單）

不需要設定 GitHub Actions 或複雜認證，直接上傳程式碼。

### 步驟 1: 準備部署套件

已為您準備好: `orange-trade-azure-ready.zip`

### 步驟 2: 使用 Azure Portal ZIP 部署

1. **前往您的 Azure Web App** (orange-trade)
2. **左側選單**  **「進階工具」** (Advanced Tools)
3. **點擊「前往」** (會開啟 Kudu 介面)
4. **在 Kudu 中**：
   - 點擊頂部選單的 **「Tools」**
   - 選擇 **「ZIP Push Deploy」**
   - **拖曳** `orange-trade-azure-ready.zip` 到頁面中
   - 等待部署完成

### 步驟 3: 設定環境變數

1. **回到 Azure Portal**  您的 Web App
2. **左側選單**  **「組態」**
3. **應用程式設定**  **「新增應用程式設定」**
4. **添加以下設定**：
   ```
   NODE_ENV = production
   JWT_SECRET = mySecureJWT123!@#
   ADMIN_USERNAME = wudodo
   INITIAL_STOCK_PRICE = 10
   ```

### 步驟 4: 重新啟動應用程式

1. **概觀頁面**  **「重新啟動」**
2. **等待 2-3 分鐘**
3. **測試**: https://orange-trade-heafh7ddbjdhea2.centralus-01.azurewebsites.net

## 優點
-  不需要認證設定
-  不需要 GitHub 配置  
-  5 分鐘即可完成
-  適合快速測試

## 未來更新
每次要更新程式碼時，重複步驟 2 即可。
