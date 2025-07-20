const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 測試 API
app.get('/api/stock/price', (req, res) => {
  res.json({
    success: true,
    price: 10.00,
    timestamp: Date.now()
  });
});

// 簡單的註冊（使用記憶體）
const users = new Map();

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必要欄位'
      });
    }
    
    // 檢查用戶是否存在
    if (users.has(username)) {
      return res.status(400).json({
        success: false,
        message: '用戶名已存在'
      });
    }
    
    // 儲存用戶（記憶體中）
    users.set(username, {
      username,
      email,
      password, // 正式環境應加密
      points: 1000,
      role: username === 'wudodo' ? 'admin' : 'user',
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      message: '註冊成功',
      user: {
        username,
        role: username === 'wudodo' ? 'admin' : 'user'
      }
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '註冊失敗: ' + error.message
    });
  }
});

// 簡單的登入
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '請輸入用戶名和密碼'
      });
    }
    
    const user = users.get(username);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: '用戶名或密碼錯誤'
      });
    }
    
    res.json({
      success: true,
      message: '登入成功',
      token: 'test-token-' + username,
      user: {
        id: username,
        username: user.username,
        points: user.points,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      message: '登入失敗: ' + error.message
    });
  }
});

// 根路徑
app.get('/', (req, res) => {
  res.send('Orange Stock Trading API - Test Server');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`測試伺服器運行在 port ${PORT}`);
});