const express = require('express');
const router = express.Router();
const { getStockPrice, getStockPriceHistory, getStockStats, getPriceImpactSettings, updatePriceImpactSettings, getTodayStockInfo, getFiveLevelQuotes, getRecentTrades } = require('../services/stockService');
const { getUserTransactions, verifyToken, getUserRankings, getUserRank } = require('../services/serviceLoader');
const { getDb } = require('../database/init');

// 中間件：驗證管理員權限
function verifyAdmin(req, res, next) {
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

  // 檢查用戶角色
  if (result.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  req.userId = result.userId;
  req.username = result.username;
  req.role = result.role;
  next();
}

// === 管理員專用路由 ===

// 獲取系統統計信息
router.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    
    // 獲取用戶統計
    const userStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_users_today
        FROM users
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // 獲取交易統計
    const tradeStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN DATE(timestamp) = DATE('now') THEN 1 END) as trades_today,
          SUM(total_amount) as total_volume,
          AVG(total_amount) as avg_trade_amount
        FROM transactions
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // 獲取股價統計
    const stockStats = await getStockStats();

    res.json({
      success: true,
      stats: {
        users: userStats,
        trades: tradeStats,
        stock: stockStats,
        currentPrice: getStockPrice()
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取所有用戶列表
router.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.id, u.username, u.email, u.role, u.points, u.created_at,
          COALESCE(h.shares, 0) as shares,
          COUNT(t.id) as trade_count
        FROM users u
        LEFT JOIN user_holdings h ON u.id = h.user_id
        LEFT JOIN transactions t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新用戶角色
router.put('/admin/users/:userId/role', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: '無效的角色' });
    }

    const db = getDb();
    db.run(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId],
      function(err) {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true, message: '用戶角色已更新' });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取管理員設置
router.get('/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    
    const settings = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM admin_settings ORDER BY setting_key',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新管理員設置
router.put('/admin/settings/:key', verifyAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.userId;

    const db = getDb();
    db.run(
      'UPDATE admin_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [value, userId, key],
      function(err) {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true, message: '設置已更新' });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手動調整股價
router.post('/admin/adjust-price', verifyAdmin, async (req, res) => {
  try {
    const { newPrice, reason } = req.body;
    const price = parseFloat(newPrice);
    
    if (!price || price <= 0) {
      return res.status(400).json({ success: false, message: '無效的價格' });
    }

    const { updateStockPrice } = require('../services/stockService');
    
    // 記錄管理員調整
    const db = getDb();
    db.run(
      'INSERT INTO stock_prices (price, volume, change_type) VALUES (?, ?, ?)',
      [price, 0, `admin_adjust:${reason || '管理員調整'}`],
      (err) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          // 更新當前價格
          require('../services/stockService').currentPrice = price;
          
          res.json({ 
            success: true, 
            message: '股價已調整',
            newPrice: price 
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 系統重置功能
router.post('/admin/reset-system', verifyAdmin, async (req, res) => {
  try {
    const { resetType } = req.body;
    const db = getDb();
    
    if (resetType === 'prices') {
      // 重置股價歷史
      db.run('DELETE FROM stock_prices WHERE change_type != "initial"', (err) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true, message: '股價歷史已重置' });
        }
      });
    } else if (resetType === 'trades') {
      // 重置交易記錄
      db.run('DELETE FROM transactions', (err) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true, message: '交易記錄已重置' });
        }
      });
    } else {
      res.status(400).json({ success: false, message: '無效的重置類型' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取當前股價
router.get('/price', (req, res) => {
  try {
    const currentPrice = getStockPrice();
    res.json({
      success: true,
      price: currentPrice,
      symbol: 'ORANGE',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('獲取股價錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取股價失敗'
    });
  }
});

// 獲取股價歷史數據
router.get('/history/:period?', async (req, res) => {
  try {
    const period = req.params.period || '24h';
    
    // 驗證時間段參數
    const validPeriods = ['1h', '24h', '7d', '30d'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: '無效的時間段，支援: 1h, 24h, 7d, 30d'
      });
    }

    const history = await getStockPriceHistory(period);
    
    res.json({
      success: true,
      period: period,
      data: history.map(item => ({
        price: parseFloat(item.price),
        timestamp: item.timestamp,
        volume: item.volume,
        type: item.change_type
      }))
    });

  } catch (error) {
    console.error('獲取股價歷史錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取股價歷史失敗'
    });
  }
});

// 獲取股票統計資料
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStockStats();
    
    res.json({
      success: true,
      stats: {
        currentPrice: stats.currentPrice,
        totalTransactions: stats.totalTransactions,
        totalBuyVolume: stats.totalBuyVolume,
        totalSellVolume: stats.totalSellVolume,
        minPrice24h: stats.minPrice24h,
        maxPrice24h: stats.maxPrice24h,
        avgPrice24h: stats.avgPrice24h,
        priceChange24h: stats.priceChange24h,
        priceChangePercentage: stats.avgPrice24h > 0 ? 
          ((stats.currentPrice - stats.avgPrice24h) / stats.avgPrice24h * 100) : 0
      }
    });

  } catch (error) {
    console.error('獲取股票統計錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取股票統計失敗'
    });
  }
});

// 獲取完整股票信息
router.get('/info', async (req, res) => {
  try {
    const stockInfo = await getTodayStockInfo();
    res.json({ success: true, data: stockInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取五檔報價
router.get('/quotes', async (req, res) => {
  try {
    const quotes = await getFiveLevelQuotes();
    res.json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取近期交易記錄
router.get('/recent-trades', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const trades = await getRecentTrades(limit);
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取用戶排行榜
router.get('/rankings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const rankings = await getUserRankings(limit);
    res.json({ success: true, data: rankings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取用戶排名
router.get('/user-rank/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const rank = await getUserRank(userId);
    res.json({ success: true, data: rank });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 獲取用戶交易歷史（需要驗證）
router.get('/transactions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    const tokenResult = verifyToken(token);
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Token無效或已過期'
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const transactions = await getUserTransactions(tokenResult.userId, limit);

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        type: tx.transaction_type,
        quantity: tx.quantity,
        price: parseFloat(tx.price),
        totalAmount: parseFloat(tx.total_amount),
        timestamp: tx.timestamp
      }))
    });

  } catch (error) {
    console.error('獲取交易歷史錯誤:', error.message);
    res.status(500).json({
      success: false,
      message: '獲取交易歷史失敗'
    });
  }
});

// 獲取價格影響設置
router.get('/price-impact-settings', (req, res) => {
  try {
    const settings = getPriceImpactSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新價格影響設置
router.post('/price-impact-settings', (req, res) => {
  try {
    const { buyImpactMultiplier, sellImpactMultiplier, volumeDecayFactor, randomFluctuation } = req.body;
    
    const newSettings = {};
    if (buyImpactMultiplier !== undefined) newSettings.buyImpactMultiplier = parseFloat(buyImpactMultiplier);
    if (sellImpactMultiplier !== undefined) newSettings.sellImpactMultiplier = parseFloat(sellImpactMultiplier);
    if (volumeDecayFactor !== undefined) newSettings.volumeDecayFactor = parseFloat(volumeDecayFactor);
    if (randomFluctuation !== undefined) newSettings.randomFluctuation = parseFloat(randomFluctuation);
    
    const updatedSettings = updatePriceImpactSettings(newSettings);
    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 