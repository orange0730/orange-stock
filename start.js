const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 基本中間件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 測試路由
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Orange Stock 系統運行正常！',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stock/price', (req, res) => {
  res.json({
    success: true,
    price: 100.00,
    symbol: 'ORANGE',
    timestamp: Date.now()
  });
});

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動服務器
server.listen(PORT, () => {
  console.log(`🚀 Orange Stock 測試服務器運行於 http://localhost:${PORT}`);
  console.log('📱 支援手機和電腦瀏覽器');
  console.log('🍊 系統狀態：正常運行');
  console.log('💡 訪問 http://localhost:3000/api/test 測試API');
  console.log('💡 訪問 http://localhost:3000 查看主頁');
});

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的Promise拒絕:', reason);
}); 