const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// 導入路由和數據庫
const authRoutes = require('./routes/auth');
const { router: tradingRoutes, setSocketIO } = require('./routes/trading');
const stockRoutes = require('./routes/stock');
const { router: limitOrdersRoutes, checkAndExecuteLimitOrders } = require('./routes/limitOrders');
const adminRoutes = require('./routes/admin');
const { initDatabase, getDb } = require('./database/init');
const { createLimitOrdersTable } = require('./database/limitOrdersInit');
const { updateStockPrice, getStockPrice, initializeStockPrice } = require('./services/stockService');
const { getUserBalance } = require('./services/userService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中間件 - 暫時禁用 CSP 以解決連線問題
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API限制
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // 100 requests
  duration: 60, // 每60秒
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ error: '請求過於頻繁，請稍後再試' });
  }
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/limit-orders', limitOrdersRoutes);
app.use('/api/admin', adminRoutes);

// 靜態檔案
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 設置Socket.IO實例到trading路由
setSocketIO(io);

// WebSocket 連接處理
io.on('connection', (socket) => {
  console.log('用戶連接:', socket.id);

  // 加入股票房間
  socket.join('orange_stock');

  // 發送當前股價
  socket.emit('stock_price_update', {
    price: getStockPrice(),
    timestamp: Date.now()
  });

  // 處理交易請求
  socket.on('trade_request', async (data) => {
    try {
      const { userId, type, quantity, token } = data;
      
      // 驗證token（簡化版本）
      if (!token) {
        socket.emit('trade_error', { message: '請先登入' });
        return;
      }

      // 執行交易邏輯（稍後實現）
      const result = await processTradeRequest(userId, type, quantity);
      
      if (result.success) {
        // 更新股價
        const newPrice = updateStockPrice(type, quantity);
        
        // 廣播股價更新
        io.to('orange_stock').emit('stock_price_update', {
          price: newPrice,
          timestamp: Date.now(),
          volume: quantity,
          type: type
        });

        // 檢查並執行限價單
        checkAndExecuteLimitOrders(newPrice);

        // 發送交易成功
        socket.emit('trade_success', result);
      } else {
        socket.emit('trade_error', result);
      }
    } catch (error) {
      socket.emit('trade_error', { message: '交易處理失敗' });
    }
  });

  socket.on('disconnect', () => {
    console.log('用戶斷線:', socket.id);
  });
});

// 模擬股價波動（每5秒）
setInterval(() => {
  const randomChange = (Math.random() - 0.5) * 0.02; // ±1%隨機波動
  const newPrice = updateStockPrice('fluctuation', randomChange);
  
  io.to('orange_stock').emit('stock_price_update', {
    price: newPrice,
    timestamp: Date.now(),
    type: 'fluctuation'
  });

  // 檢查並執行限價單
  checkAndExecuteLimitOrders(newPrice);
}, 5000);

// 初始化數據庫並啟動服務器
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initDatabase();
    console.log('數據庫初始化完成');
    
    await createLimitOrdersTable();
    console.log('限價單表初始化完成');
    
    await initializeStockPrice();
    console.log('股價初始化完成');
    
    server.listen(PORT, () => {
      console.log(`🚀 Orange Stock 交易系統運行於 http://localhost:${PORT}`);
      console.log('📱 支援手機和電腦瀏覽器');
      console.log('🍊 Orange股票初始價格: $', getStockPrice());
    });
  } catch (error) {
    console.error('服務器啟動失敗:', error);
    process.exit(1);
  }
}

// 簡化的交易處理函數
async function processTradeRequest(userId, type, quantity) {
  // 這裡稍後實現完整的交易邏輯
  return { success: true, message: '交易成功' };
}

startServer(); 