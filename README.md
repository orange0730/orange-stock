# 🍊 Orange Stock Trading System

一個基於Node.js和Socket.IO的虛擬股票交易系統，支援實時價格更新和點數交易。

## 🌟 特色功能

- 🍊 **虛擬股票交易** - 使用點數進行Orange股票交易
- 📊 **實時價格圖表** - 支援多時間段（1小時/24小時/7天/30天）
- 💰 **點數系統** - 註冊即獲得10000點數，無手續費交易
- 📱 **響應式設計** - 完美支援手機和電腦瀏覽器
- 🌙 **深色主題** - 舒適的深色界面設計
- ⚡ **即時更新** - WebSocket實時股價和交易通知
- 🔐 **安全認證** - JWT token身份驗證
- 🐳 **容器化部署** - Docker支援，一鍵部署

## 🚀 快速開始

### 本地開發

1. **克隆專案**
```bash
git clone <repository-url>
cd orange-trade
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發服務器**
```bash
npm run dev
```

4. **訪問應用**
   - 打開瀏覽器訪問 http://localhost:3000
   - 註冊新帳號獲得10000點數
   - 開始交易Orange股票！

### 生產環境部署

#### Docker部署（推薦）

1. **使用Docker Compose**
```bash
docker-compose up -d
```

2. **或者使用Docker**
```bash
# 構建映像
docker build -t orange-stock .

# 運行容器
docker run -d \
  --name orange-stock \
  -p 3000:3000 \
  -e JWT_SECRET=your_secure_secret \
  -v orange_data:/app/data \
  orange-stock
```

#### 雲端部署

**支援的平台：**
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

**環境變量：**
```bash
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
PORT=3000
```

## 📋 系統需求

- Node.js 16+ 
- NPM 7+
- 支援WebSocket的現代瀏覽器

## 🎮 使用指南

### 用戶註冊和登入
1. 點擊「註冊」按鈕
2. 填寫用戶名、郵箱和密碼
3. 註冊成功後自動獲得10000點數
4. 使用帳號密碼登入系統

### 股票交易
1. 登入後進入交易界面
2. 查看當前Orange股價和個人資產
3. 輸入想要交易的股數
4. 點擊「買入」或「賣出」按鈕
5. 交易成功後股價會根據供需變動

### 查看數據
- **價格圖表** - 切換不同時間段查看股價走勢
- **交易歷史** - 查看個人所有交易記錄
- **實時統計** - 查看24小時價格變化和交易量

## 🏗️ 技術架構

### 後端技術
- **Node.js** - 服務器運行環境
- **Express.js** - Web框架
- **Socket.IO** - WebSocket實時通信
- **SQLite** - 輕量級數據庫
- **JWT** - 身份認證
- **bcryptjs** - 密碼加密

### 前端技術
- **HTML5/CSS3** - 響應式界面
- **JavaScript ES6+** - 現代JS特性
- **Chart.js** - 股價圖表繪製
- **Socket.IO Client** - 實時數據更新

### 部署技術
- **Docker** - 容器化部署
- **Docker Compose** - 多容器編排

## 📊 數據庫結構

```sql
-- 用戶表
users (id, username, email, password_hash, points, orange_shares, created_at, last_login)

-- 股價歷史表
stock_prices (id, stock_symbol, price, volume, change_type, timestamp)

-- 交易記錄表
transactions (id, user_id, stock_symbol, transaction_type, quantity, price, total_amount, timestamp)

-- 用戶持股表
user_holdings (id, user_id, stock_symbol, shares, average_price, updated_at)

-- 系統設定表
system_settings (id, setting_name, setting_value, updated_at)
```

## 🔧 配置選項

在`server.js`中可以調整以下參數：

```javascript
// 初始點數
const INITIAL_POINTS = 10000;

// 股價波動頻率（毫秒）
const PRICE_FLUCTUATION_INTERVAL = 5000;

// API請求限制（每分鐘）
const RATE_LIMIT_REQUESTS = 100;
```

## 🐛 故障排除

### 常見問題

**問題：無法連接WebSocket**
- 檢查防火牆設定
- 確認端口3000未被佔用

**問題：資料庫錯誤**
- 檢查data目錄權限
- 重新初始化數據庫

**問題：登入失敗**
- 檢查JWT_SECRET環境變量
- 清除瀏覽器localStorage

### 日誌查看
```bash
# Docker容器日誌
docker logs orange-stock

# PM2日誌
pm2 logs
```

## 🤝 貢獻指南

1. Fork專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟Pull Request

## 📝 更新日誌

### v1.0.0 (2024-01-XX)
- 🎉 初始版本發布
- ✨ 基礎交易功能
- 📊 實時價格圖表
- 🔐 用戶認證系統
- 📱 響應式設計
- 🐳 Docker支援

## 📄 授權協議

本專案採用 MIT 授權協議 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 📞 聯繫方式

- 專案維護者：[Your Name]
- 電子郵件：[your.email@example.com]
- 專案首頁：[https://github.com/yourusername/orange-trade]

---

🍊 **快樂交易！享受Orange股票的投資樂趣！** 🍊 