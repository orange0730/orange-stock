const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyToken } = require('../services/serviceLoader');

// 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 輸入驗證
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必要欄位'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用戶名長度必須在3-20字符之間'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密碼長度至少6位'
      });
    }

    // 簡單的郵箱格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '請輸入有效的郵箱地址'
      });
    }

    const result = await registerUser(username, email, password);
    res.status(201).json(result);

  } catch (error) {
    console.error('註冊錯誤:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 用戶登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 輸入驗證
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '請輸入用戶名和密碼'
      });
    }

    const result = await loginUser(username, password);
    res.json(result);

  } catch (error) {
    console.error('登入錯誤:', error.message);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// 驗證token有效性
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供授權token'
      });
    }

    const result = verifyToken(token);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Token有效',
        userId: result.userId,
        username: result.username
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Token無效或已過期'
      });
    }

  } catch (error) {
    console.error('Token驗證錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '服務器錯誤'
    });
  }
});

// 登出（客戶端處理，服務器端只需要確認）
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router; 