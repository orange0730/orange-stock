# Orange Trade Azure Web App 快速啟動 (PowerShell 版本)
# 支援完整的中文顯示

param(
    [string]$AppName,
    [string]$ResourceGroup,
    [string]$Location = "East Asia"
)

# 設置控制台編碼為 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    🚀 Orange Trade Azure Web App 快速啟動" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "👋 歡迎使用 Azure Web App 部署嚮導！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 在開始之前，請確保您已準備好：" -ForegroundColor White
Write-Host "   ✅ Azure 帳戶和有效訂閱" -ForegroundColor White
Write-Host "   ✅ Azure CLI (已安裝並登入)" -ForegroundColor White
Write-Host "   ✅ 應用程式名稱 (全球唯一)" -ForegroundColor White
Write-Host ""

# 檢查 Azure CLI 是否已安裝
Write-Host "🔍 檢查 Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure CLI 已安裝" -ForegroundColor Green
    } else {
        throw "Azure CLI not found"
    }
} catch {
    Write-Host "❌ 未找到 Azure CLI" -ForegroundColor Red
    Write-Host "📥 請前往安裝: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    Read-Host "按任意鍵退出"
    exit 1
}

# 檢查是否已登入
Write-Host "🔐 檢查登入狀態..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "✅ 已登入 Azure (訂閱: $($account.name))" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "🔑 需要登入 Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 登入失敗" -ForegroundColor Red
        Read-Host "按任意鍵退出"
        exit 1
    }
}

Write-Host ""
Write-Host "📝 請輸入您的配置資訊：" -ForegroundColor White
Write-Host ""

# 獲取應用程式名稱
if (-not $AppName) {
    do {
        $AppName = Read-Host "🏷️  輸入應用程式名稱 (例: my-orange-trade)"
        if (-not $AppName) {
            Write-Host "❌ 應用程式名稱不能為空" -ForegroundColor Red
        }
    } while (-not $AppName)
}

# 獲取資源群組
if (-not $ResourceGroup) {
    $defaultRG = "$AppName-rg"
    $ResourceGroup = Read-Host "📦 輸入資源群組名稱 (預設: $defaultRG)"
    if (-not $ResourceGroup) {
        $ResourceGroup = $defaultRG
    }
}

# 獲取位置
if (-not $Location) {
    Write-Host ""
    Write-Host "🌍 選擇部署區域：" -ForegroundColor White
    Write-Host "   1. East Asia (東亞 - 香港)" -ForegroundColor White
    Write-Host "   2. Southeast Asia (東南亞 - 新加坡)" -ForegroundColor White
    Write-Host "   3. Japan East (日本東部)" -ForegroundColor White
    Write-Host "   4. Korea Central (韓國中部)" -ForegroundColor White
    Write-Host "   5. Australia East (澳洲東部)" -ForegroundColor White
    Write-Host ""
    
    $locationChoice = Read-Host "選擇區域 (1-5, 預設: 1)"
    if (-not $locationChoice) { $locationChoice = "1" }
    
    switch ($locationChoice) {
        "1" { $Location = "East Asia" }
        "2" { $Location = "Southeast Asia" }
        "3" { $Location = "Japan East" }
        "4" { $Location = "Korea Central" }
        "5" { $Location = "Australia East" }
        default { $Location = "East Asia" }
    }
}

Write-Host ""
Write-Host "📋 確認配置資訊：" -ForegroundColor White
Write-Host "   應用程式名稱: $AppName" -ForegroundColor Cyan
Write-Host "   資源群組: $ResourceGroup" -ForegroundColor Cyan
Write-Host "   部署區域: $Location" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "✅ 確認開始部署嗎？ (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ 已取消部署" -ForegroundColor Red
    Read-Host "按任意鍵退出"
    exit 0
}

Write-Host ""
Write-Host "🚀 開始部署流程..." -ForegroundColor Yellow
Write-Host ""

try {
    # 建立資源群組
    Write-Host "🏗️  建立資源群組..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location
    if ($LASTEXITCODE -ne 0) { throw "建立資源群組失敗" }

    # 建立 App Service 方案
    Write-Host "📦 建立 App Service 方案..." -ForegroundColor Yellow
    az appservice plan create `
        --name "$AppName-plan" `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku B1 `
        --is-linux
    if ($LASTEXITCODE -ne 0) { throw "建立 App Service 方案失敗" }

    # 建立 Web App
    Write-Host "🌐 建立 Web App..." -ForegroundColor Yellow
    az webapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --plan "$AppName-plan" `
        --runtime "NODE|18-lts"
    if ($LASTEXITCODE -ne 0) { throw "建立 Web App 失敗" }

    # 啟用 WebSocket
    Write-Host "⚡ 啟用 WebSocket 支援..." -ForegroundColor Yellow
    az webapp config set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --web-sockets-enabled true

    # 設定基本環境變數
    Write-Host "🔧 設定基本環境變數..." -ForegroundColor Yellow
    az webapp config appsettings set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --settings `
            NODE_ENV=production `
            PORT=8080 `
            WEBSITE_NODE_DEFAULT_VERSION=18-lts `
            SCM_DO_BUILD_DURING_DEPLOYMENT=true

    # 建立部署套件
    Write-Host "📦 建立部署套件..." -ForegroundColor Yellow
    $zipFile = "$AppName.zip"
    if (Test-Path $zipFile) { Remove-Item $zipFile }
    
    # 排除不需要的文件和目錄
    $excludePatterns = @('node_modules', '.git', 'tests', '*.md', '*.zip')
    Compress-Archive -Path * -DestinationPath $zipFile -Force -CompressionLevel Optimal

    # 部署應用程式
    Write-Host "🚚 部署應用程式..." -ForegroundColor Yellow
    az webapp deployment source config-zip `
        --name $AppName `
        --resource-group $ResourceGroup `
        --src $zipFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "     ✅ 部署成功完成！" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 您的應用程式 URL: https://$AppName.azurewebsites.net" -ForegroundColor Cyan
        Write-Host "📊 Azure Portal: https://portal.azure.com/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 重要的後續步驟：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. 🔐 設定安全環境變數：" -ForegroundColor White
        Write-Host "   - JWT_SECRET (JWT 密鑰)" -ForegroundColor Gray
        Write-Host "   - ADMIN_USERNAME (管理員用戶名)" -ForegroundColor Gray
        Write-Host "   - INITIAL_STOCK_PRICE (初始股價)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. 🗃️  設定數據庫連線 (如果使用雲端數據庫)：" -ForegroundColor White
        Write-Host "   - Firestore 或 Cosmos DB 相關設定" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. 📊 設定監控：" -ForegroundColor White
        Write-Host "   - 啟用 Application Insights" -ForegroundColor Gray
        Write-Host "   - 設定警示規則" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. 🛡️  安全性設定：" -ForegroundColor White
        Write-Host "   - 設定自訂網域" -ForegroundColor Gray
        Write-Host "   - 啟用 SSL 憑證" -ForegroundColor Gray
        Write-Host "   - 設定 HTTPS 重新導向" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 設定環境變數的方法：" -ForegroundColor Yellow
        Write-Host "   1. 前往 Azure Portal" -ForegroundColor Gray
        Write-Host "   2. 找到您的 App Service: $AppName" -ForegroundColor Gray
        Write-Host "   3. 左側選單 → Configuration" -ForegroundColor Gray
        Write-Host "   4. Application settings → New application setting" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📖 詳細指南請參考: azure-deployment-guide.md" -ForegroundColor Cyan
        Write-Host ""
    } else {
        throw "部署失敗"
    }

} catch {
    Write-Host "❌ 錯誤: $_" -ForegroundColor Red
    Write-Host "請檢查錯誤訊息並重試" -ForegroundColor Yellow
} finally {
    # 清理暫存檔案
    Write-Host "🧹 清理暫存檔案..." -ForegroundColor Yellow
    if (Test-Path "$AppName.zip") { 
        Remove-Item "$AppName.zip" -Force 
    }
}

Write-Host ""
Write-Host "感謝使用 Orange Trade Azure 部署嚮導！" -ForegroundColor Green
Read-Host "按任意鍵退出" 