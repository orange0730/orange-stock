# Azure Service Principal 設定指南

## 步驟 1: 在 Azure Portal 建立 Service Principal

1. 前往 Azure Portal  Azure Active Directory
2. 左側選單  App registrations
3. 點擊 "New registration"
4. 輸入名稱: "GitHub-Actions-orange-trade"
5. 點擊 "Register"
6. 記下 Application (client) ID
7. 記下 Directory (tenant) ID

## 步驟 2: 建立 Client Secret

1. 在同一個 App registration 中
2. 左側選單  Certificates & secrets
3. 點擊 "New client secret"
4. 輸入描述，選擇到期時間
5. 記下 Secret Value (只會顯示一次)

## 步驟 3: 分配權限

1. 前往 Azure Portal  Subscriptions
2. 選擇您的訂閱
3. 左側選單  Access control (IAM)
4. 點擊 "Add role assignment"
5. Role: "Contributor"
6. Assign access to: "User, group, or service principal"
7. 搜尋並選擇您的 App registration

## 步驟 4: 在 GitHub 設定 Secrets

在 GitHub 存儲庫中設定以下 Secrets:
- AZURE_CLIENT_ID: Application (client) ID
- AZURE_CLIENT_SECRET: Client secret value  
- AZURE_TENANT_ID: Directory (tenant) ID
- AZURE_SUBSCRIPTION_ID: 您的 Azure 訂閱 ID

## 步驟 5: 使用更新的工作流程

將使用新的認證方式部署到 Azure。
