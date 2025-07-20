const express = require('express');
const router = express.Router();
const { verifyToken } = require('../services/serviceLoader');
const { getDb, isUsingFirestore } = require('../database/init');

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

// 創建限價單
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { orderType, quantity, limitPrice } = req.body;
    const userId = req.userId;

    // 輸入驗證
    if (!orderType || !quantity || !limitPrice) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必要欄位'
      });
    }

    if (quantity <= 0 || limitPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: '數量和價格必須大於0'
      });
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: '無效的訂單類型'
      });
    }

    const db = getDb();
    
    // 插入限價單
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO limit_orders (user_id, order_type, quantity, limit_price, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [userId, orderType, quantity, limitPrice],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });

    res.json({
      success: true,
      message: `限價單創建成功！${orderType === 'buy' ? '買入' : '賣出'} ${quantity}股 @ $${limitPrice}`
    });

  } catch (error) {
    console.error('創建限價單錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '創建限價單失敗'
    });
  }
});

// 獲取用戶限價單
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const status = req.query.status || 'active';

    const db = getDb();
    
    const orders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, order_type, quantity, limit_price, status, created_at
         FROM limit_orders 
         WHERE user_id = ? AND status = ?
         ORDER BY created_at DESC`,
        [userId, status],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        type: order.order_type,
        quantity: order.quantity,
        price: parseFloat(order.limit_price),
        status: order.status,
        createdAt: order.created_at
      }))
    });

  } catch (error) {
    console.error('獲取限價單錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取限價單失敗'
    });
  }
});

// 取消限價單
router.delete('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId;

    const db = getDb();
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE limit_orders 
         SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND status = 'active'`,
        [orderId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到該限價單或已取消'
      });
    }

    res.json({
      success: true,
      message: '限價單已取消'
    });

  } catch (error) {
    console.error('取消限價單錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '取消限價單失敗'
    });
  }
});

// 檢查並執行限價單（當股價達到條件時）
async function checkAndExecuteLimitOrders(currentPrice) {
  const db = getDb();
  if (!db) return;

  if (isUsingFirestore()) {
    // Firestore 版本 - 暫時跳過限價單功能
    console.log('Firestore 模式：限價單功能暫時停用');
    return;
  }

  // SQLite 版本
  db.all(
    `SELECT lo.*, u.points 
     FROM limit_orders lo
     JOIN users u ON lo.user_id = u.id
     WHERE lo.status = 'active' 
     AND ((lo.order_type = 'buy' AND lo.limit_price >= ?) 
          OR (lo.order_type = 'sell' AND lo.limit_price <= ?))`,
    [currentPrice, currentPrice],
    (err, orders) => {
      if (err) {
        console.error('檢查限價單失敗:', err);
        return;
      }

      orders.forEach(order => {
        executeLimitOrder(order, currentPrice);
      });
    }
  );
}

// 執行限價單
function executeLimitOrder(order, currentPrice) {
  const db = getDb();
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 標記限價單為已執行
    db.run(
      `UPDATE limit_orders 
       SET status = 'executed', executed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [order.id]
    );

    // 執行交易邏輯（類似於普通交易）
    const totalAmount = currentPrice * order.quantity;
    
    if (order.order_type === 'buy') {
      // 扣除點數，增加股票
      db.run(
        "UPDATE users SET points = points - ? WHERE id = ?",
        [totalAmount, order.user_id]
      );
      
      db.run(
        `INSERT OR REPLACE INTO user_holdings (user_id, stock_symbol, shares, updated_at)
         VALUES (?, 'ORANGE', 
           COALESCE((SELECT shares FROM user_holdings WHERE user_id = ? AND stock_symbol = 'ORANGE'), 0) + ?,
           CURRENT_TIMESTAMP)`,
        [order.user_id, order.user_id, order.quantity]
      );
    } else {
      // 增加點數，減少股票
      db.run(
        "UPDATE users SET points = points + ? WHERE id = ?",
        [totalAmount, order.user_id]
      );
      
      db.run(
        `UPDATE user_holdings 
         SET shares = shares - ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND stock_symbol = 'ORANGE'`,
        [order.quantity, order.user_id]
      );
    }

    // 記錄交易
    db.run(
      `INSERT INTO transactions (user_id, transaction_type, quantity, price, total_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [order.user_id, order.order_type, order.quantity, currentPrice, totalAmount]
    );

    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        console.error('執行限價單失敗:', err);
      } else {
        console.log(`限價單 ${order.id} 執行成功`);
      }
    });
  });
}

module.exports = {
  router,
  checkAndExecuteLimitOrders
}; 