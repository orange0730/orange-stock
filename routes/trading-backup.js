const express = require('express');
const router = express.Router();
const { verifyToken, getUserBalance, updateUserBalance } = require('../services/serviceLoader');
const { getStockPrice, updateStockPrice } = require('../services/stockService');
const { getDb } = require('../database/init');

// 獲取Socket.IO實例的函數
let getSocketIO = null;

// 設置Socket.IO實例
function setSocketIO(io) {
  getSocketIO = () => io;
}

// 中間件：驗證用戶身份
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '請先登入'
    });
  }

  const result = verifyToken(token);
  if (!result.success) {
    return res.status(401).json({
      success: false,
      message: 'Token無效或已過期'
    });
  }

  req.userId = result.userId;
  req.username = result.username;
  next();
}

// 買入股票
router.post('/buy', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.userId;

    // 輸入驗證
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: '請輸入有效的股票數量（正整數）'
      });
    }

    // 獲取當前股價和用戶餘額
    const currentPrice = getStockPrice();
    const totalCost = currentPrice * quantity;
    const userBalance = await getUserBalance(userId);

    // 檢查用戶點數是否足夠
    if (userBalance.points < totalCost) {
      return res.status(400).json({
        success: false,
        message: `點數不足！需要 ${totalCost.toFixed(2)} 點數，目前只有 ${userBalance.points} 點數`
      });
    }

    // 執行交易
    const db = getDb();
    
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 記錄交易
        db.run(
          `INSERT INTO transactions (user_id, transaction_type, quantity, price, total_amount)
           VALUES (?, 'buy', ?, ?, ?)`,
          [userId, quantity, currentPrice, totalCost],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        // 更新用戶餘額和持股
        db.run(
          "UPDATE users SET points = points - ? WHERE id = ?",
          [totalCost, userId],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        // 更新持股
        db.run(
          `INSERT OR REPLACE INTO user_holdings (user_id, stock_symbol, shares, average_price, updated_at)
           VALUES (?, 'ORANGE', 
             COALESCE((SELECT shares FROM user_holdings WHERE user_id = ? AND stock_symbol = 'ORANGE'), 0) + ?,
             (COALESCE((SELECT shares * average_price FROM user_holdings WHERE user_id = ? AND stock_symbol = 'ORANGE'), 0) + ?) / 
             (COALESCE((SELECT shares FROM user_holdings WHERE user_id = ? AND stock_symbol = 'ORANGE'), 0) + ?),
             CURRENT_TIMESTAMP)`,
          [userId, userId, quantity, userId, totalCost, userId, quantity],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        db.run("COMMIT", (err) => {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    // 更新股價（買入造成價格上漲）
    const newPrice = updateStockPrice('buy', quantity);

    // 廣播股價更新給所有客戶端
    if (getSocketIO) {
      const io = getSocketIO();
      if (io) {
        io.to('orange_stock').emit('stock_price_update', {
          price: newPrice,
          timestamp: Date.now(),
          volume: quantity,
          type: 'buy'
        });
      }
    }

    res.json({
      success: true,
      message: `成功買入 ${quantity} 股 Orange！`,
      transaction: {
        type: 'buy',
        quantity: quantity,
        price: currentPrice,
        totalCost: totalCost,
        newPrice: newPrice
      }
    });

  } catch (error) {
    console.error('買入股票錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '交易處理失敗'
    });
  }
});

// 賣出股票
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.userId;

    // 輸入驗證
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: '請輸入有效的股票數量（正整數）'
      });
    }

    // 獲取當前股價和用戶持股
    const currentPrice = getStockPrice();
    const userBalance = await getUserBalance(userId);

    // 檢查用戶持股是否足夠
    if (userBalance.orangeShares < quantity) {
      return res.status(400).json({
        success: false,
        message: `持股不足！需要 ${quantity} 股，目前只有 ${userBalance.orangeShares} 股`
      });
    }

    const totalRevenue = currentPrice * quantity;

    // 執行交易
    const db = getDb();
    
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 記錄交易
        db.run(
          `INSERT INTO transactions (user_id, transaction_type, quantity, price, total_amount)
           VALUES (?, 'sell', ?, ?, ?)`,
          [userId, quantity, currentPrice, totalRevenue],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        // 更新用戶餘額
        db.run(
          "UPDATE users SET points = points + ? WHERE id = ?",
          [totalRevenue, userId],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        // 更新持股
        db.run(
          `UPDATE user_holdings 
           SET shares = shares - ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND stock_symbol = 'ORANGE'`,
          [quantity, userId],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );

        db.run("COMMIT", (err) => {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    // 更新股價（賣出造成價格下跌）
    const newPrice = updateStockPrice('sell', quantity);

    // 廣播股價更新給所有客戶端
    if (getSocketIO) {
      const io = getSocketIO();
      if (io) {
        io.to('orange_stock').emit('stock_price_update', {
          price: newPrice,
          timestamp: Date.now(),
          volume: quantity,
          type: 'sell'
        });
      }
    }

    res.json({
      success: true,
      message: `成功賣出 ${quantity} 股 Orange！`,
      transaction: {
        type: 'sell',
        quantity: quantity,
        price: currentPrice,
        totalRevenue: totalRevenue,
        newPrice: newPrice
      }
    });

  } catch (error) {
    console.error('賣出股票錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '交易處理失敗'
    });
  }
});

// 獲取用戶資產信息
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userBalance = await getUserBalance(userId);
    const currentPrice = getStockPrice();
    
    const totalValue = userBalance.points + (userBalance.orangeShares * currentPrice);
    const stockValue = userBalance.orangeShares * currentPrice;
    const profitLoss = stockValue - (userBalance.orangeShares * userBalance.averagePrice);

    res.json({
      success: true,
      portfolio: {
        points: userBalance.points,
        orangeShares: userBalance.orangeShares,
        averagePrice: userBalance.averagePrice,
        currentPrice: currentPrice,
        stockValue: stockValue,
        totalValue: totalValue,
        profitLoss: profitLoss,
        profitLossPercentage: userBalance.averagePrice > 0 ? 
          ((currentPrice - userBalance.averagePrice) / userBalance.averagePrice * 100) : 0
      }
    });

  } catch (error) {
    console.error('獲取資產信息錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取資產信息失敗'
    });
  }
});

module.exports = { 
  router,
  setSocketIO 
}; 