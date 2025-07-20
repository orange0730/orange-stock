const express = require('express');
const router = express.Router();
const { verifyToken, getUserInfo, updateUserPoints } = require('../services/serviceLoader');
const { getStockPrice, updateStockPrice } = require('../services/stockService');
const { getDb, isUsingFirestore } = require('../database/init');

// 獲取Socket.IO實例的函數
let getSocketIO = null;

// 設置Socket.IO實例
function setSocketIO(io) {
  getSocketIO = () => io;
}

// 中間件：驗證用戶身份
async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '請先登入'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token無效或已過期'
    });
  }
}

// 執行交易（買入或賣出）
router.post('/execute', authenticateToken, async (req, res) => {
  const { type, quantity } = req.body;
  const userId = req.user.id;

  if (!type || !quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: '無效的交易參數'
    });
  }

  try {
    const db = getDb();
    const currentPrice = getStockPrice();
    const totalCost = currentPrice * quantity;

    // 獲取用戶資訊
    const userInfo = await getUserInfo(userId);
    
    if (type === 'buy') {
      // 買入
      if (userInfo.points < totalCost) {
        return res.status(400).json({
          success: false,
          message: '點數不足'
        });
      }

      // 扣除點數
      await updateUserPoints(userId, totalCost, 'subtract');
      
      // 更新股價
      const newPrice = updateStockPrice('buy', quantity);

      // 記錄交易（Firestore）
      if (isUsingFirestore()) {
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
          user_id: userId,
          type: 'buy',
          quantity,
          price: currentPrice,
          total_amount: totalCost,
          created_at: new Date()
        });
      }

      // 廣播股價更新
      if (getSocketIO) {
        const io = getSocketIO();
        io.emit('stock_price_update', {
          price: newPrice,
          timestamp: Date.now(),
          volume: quantity,
          type: 'buy'
        });
      }

      return res.json({
        success: true,
        message: '買入成功',
        transaction: {
          type: 'buy',
          quantity,
          price: currentPrice,
          total: totalCost
        },
        newPrice,
        remainingPoints: userInfo.points - totalCost
      });

    } else if (type === 'sell') {
      // 賣出 - 簡化版本，假設用戶有足夠股票
      
      // 增加點數
      await updateUserPoints(userId, totalCost, 'add');
      
      // 更新股價
      const newPrice = updateStockPrice('sell', quantity);

      // 記錄交易（Firestore）
      if (isUsingFirestore()) {
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
          user_id: userId,
          type: 'sell',
          quantity,
          price: currentPrice,
          total_amount: totalCost,
          created_at: new Date()
        });
      }

      // 廣播股價更新
      if (getSocketIO) {
        const io = getSocketIO();
        io.emit('stock_price_update', {
          price: newPrice,
          timestamp: Date.now(),
          volume: quantity,
          type: 'sell'
        });
      }

      return res.json({
        success: true,
        message: '賣出成功',
        transaction: {
          type: 'sell',
          quantity,
          price: currentPrice,
          total: totalCost
        },
        newPrice,
        remainingPoints: userInfo.points + totalCost
      });
    }

  } catch (error) {
    console.error('交易執行失敗:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '交易執行失敗'
    });
  }
});

// 獲取用戶持股資訊
router.get('/holdings', authenticateToken, async (req, res) => {
  try {
    const userInfo = await getUserInfo(req.user.id);
    const currentPrice = getStockPrice();
    
    res.json({
      success: true,
      holdings: {
        stock_symbol: 'ORANGE',
        shares: 0, // 簡化版本
        average_price: 0,
        current_price: currentPrice,
        current_value: 0,
        profit_loss: 0,
        profit_loss_percent: 0
      },
      points: userInfo.points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取持股資訊失敗'
    });
  }
});

// 獲取交易歷史
router.get('/history', authenticateToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const db = getDb();
    let transactions = [];
    
    if (isUsingFirestore()) {
      const snapshot = await db.collection('transactions')
        .where('user_id', '==', req.user.id)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      snapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.json({
      success: true,
      transactions: [] // 返回空陣列避免錯誤
    });
  }
});

module.exports = {
  router,
  setSocketIO
};