const { getDb, isUsingFirestore } = require('../database/init');

// 當前股價（記憶體快取）
let currentPrice = 10.00;

// 價格影響參數（可調整）
let priceImpactSettings = {
  buyImpactMultiplier: 0.7,    // 買入影響倍數
  sellImpactMultiplier: 0.7,   // 賣出影響倍數
  volumeDecayFactor: 1500,     // 量級衰減因子
  randomFluctuation: 0.02      // 隨機波動幅度（±2%）
};

// 獲取當前股價
function getStockPrice() {
  return currentPrice;
}

// 獲取價格影響設置
function getPriceImpactSettings() {
  return { ...priceImpactSettings };
}

// 更新價格影響設置
function updatePriceImpactSettings(newSettings) {
  priceImpactSettings = { ...priceImpactSettings, ...newSettings };
  savePriceImpactSettings();
  return priceImpactSettings;
}

// 保存價格影響設置到數據庫
function savePriceImpactSettings() {
  const db = getDb();
  if (!db) return;

  db.run(
    `INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`,
    ['price_impact_settings', JSON.stringify(priceImpactSettings)],
    (err) => {
      if (err) {
        console.error('保存價格影響設置失敗:', err.message);
      }
    }
  );
}

// 載入價格影響設置
function loadPriceImpactSettings() {
  // 暫時使用預設設置
  console.log('使用預設價格影響設置');
  return Promise.resolve();
          }
        }
        resolve();
      }
    );
  });
}

// 更新股價（使用可調整參數）
function updateStockPrice(type, data) {
  let priceChange = 0;
  let newPrice = currentPrice;

  switch (type) {
    case 'buy':
      // 買入造成價格上漲（基於供需理論和可調整參數）
      priceChange = Math.log(1 + data / priceImpactSettings.volumeDecayFactor) * priceImpactSettings.buyImpactMultiplier;
      break;
    
    case 'sell':
      // 賣出造成價格下跌（使用可調整參數）
      priceChange = -Math.log(1 + data / priceImpactSettings.volumeDecayFactor) * priceImpactSettings.sellImpactMultiplier;
      break;
    
    case 'fluctuation':
      // 隨機波動（使用可調整參數）
      priceChange = data * currentPrice * priceImpactSettings.randomFluctuation;
      break;
  }

  newPrice = Math.max(1, currentPrice + priceChange); // 確保價格不低於$1
  newPrice = Math.round(newPrice * 100) / 100; // 四捨五入到小數點後兩位

  currentPrice = newPrice;

  // 保存到數據庫
  savePriceToDatabase(newPrice, data, type);

  return newPrice;
}

// 保存股價到數據庫
function savePriceToDatabase(price, volume, changeType) {
  const db = getDb();
  if (!db) return;

  db.run(
    "INSERT INTO stock_prices (price, volume, change_type) VALUES (?, ?, ?)",
    [price, volume || 0, changeType],
    (err) => {
      if (err) {
        console.error('保存股價失敗:', err.message);
      }
    }
  );
}

// 獲取股價歷史（用於繪製圖表）
function getStockPriceHistory(period = '24h') {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "AND timestamp >= datetime('now', '-1 hour')";
        break;
      case '24h':
        timeFilter = "AND timestamp >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeFilter = "AND timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeFilter = "AND timestamp >= datetime('now', '-30 days')";
        break;
      default:
        timeFilter = "AND timestamp >= datetime('now', '-1 day')";
    }

    const sql = `
      SELECT price, timestamp, volume, change_type
      FROM stock_prices 
      WHERE 1=1 ${timeFilter}
      ORDER BY timestamp ASC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 獲取股票統計信息
function getStockStats() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN change_type = 'buy' THEN volume ELSE 0 END) as total_buy_volume,
        SUM(CASE WHEN change_type = 'sell' THEN volume ELSE 0 END) as total_sell_volume,
        MIN(price) as min_price_24h,
        MAX(price) as max_price_24h,
        AVG(price) as avg_price_24h
      FROM stock_prices 
      WHERE timestamp >= datetime('now', '-1 day')
    `;

    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          currentPrice: currentPrice,
          totalTransactions: row.total_transactions || 0,
          totalBuyVolume: row.total_buy_volume || 0,
          totalSellVolume: row.total_sell_volume || 0,
          minPrice24h: row.min_price_24h || currentPrice,
          maxPrice24h: row.max_price_24h || currentPrice,
          avgPrice24h: row.avg_price_24h || currentPrice,
          priceChange24h: currentPrice - (row.avg_price_24h || currentPrice)
        });
      }
    });
  });
}

// 獲取完整股票信息（今日數據）
function getTodayStockInfo() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    // 獲取今日股價數據
    const todayStockSql = `
      SELECT 
        MIN(price) as today_low,
        MAX(price) as today_high,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN change_type IN ('buy', 'sell') THEN volume ELSE 0 END) as total_volume,
        SUM(CASE WHEN change_type IN ('buy', 'sell') THEN price * volume ELSE 0 END) as total_amount,
        (SELECT price FROM stock_prices WHERE date(timestamp) = date('now') ORDER BY timestamp ASC LIMIT 1) as open_price,
        AVG(price) as avg_price
      FROM stock_prices 
      WHERE date(timestamp) = date('now')
        AND change_type IN ('buy', 'sell', 'fluctuation')
    `;

    db.get(todayStockSql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        const stockInfo = {
          currentPrice: currentPrice,
          openPrice: row.open_price || currentPrice,
          todayHigh: row.today_high || currentPrice,
          todayLow: row.today_low || currentPrice,
          avgPrice: row.avg_price || currentPrice,
          totalVolume: row.total_volume || 0,
          totalAmount: row.total_amount || 0,
          transactionCount: row.transaction_count || 0,
          priceChange: currentPrice - (row.open_price || currentPrice),
          priceChangePercent: row.open_price ? ((currentPrice - row.open_price) / row.open_price * 100) : 0
        };
        resolve(stockInfo);
      }
    });
  });
}

// 獲取五檔報價（基於限價單）
function getFiveLevelQuotes() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    // 獲取買入掛單（價格從高到低）
    const buyOrdersSql = `
      SELECT target_price as price, SUM(quantity) as quantity
      FROM limit_orders 
      WHERE type = 'buy' AND status = 'pending'
      GROUP BY target_price
      ORDER BY target_price DESC
      LIMIT 5
    `;

    // 獲取賣出掛單（價格從低到高）
    const sellOrdersSql = `
      SELECT target_price as price, SUM(quantity) as quantity
      FROM limit_orders 
      WHERE type = 'sell' AND status = 'pending'
      GROUP BY target_price
      ORDER BY target_price ASC
      LIMIT 5
    `;

    db.all(buyOrdersSql, [], (err, buyOrders) => {
      if (err) {
        reject(err);
        return;
      }

      db.all(sellOrdersSql, [], (err, sellOrders) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          buyOrders: buyOrders || [],
          sellOrders: sellOrders || []
        });
      });
    });
  });
}

// 獲取近期交易記錄
function getRecentTrades(limit = 20) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    const sql = `
      SELECT 
        sp.price,
        sp.volume,
        sp.change_type as type,
        sp.timestamp,
        CASE 
          WHEN sp.price > LAG(sp.price) OVER (ORDER BY sp.timestamp) THEN 'up'
          WHEN sp.price < LAG(sp.price) OVER (ORDER BY sp.timestamp) THEN 'down'
          ELSE 'flat'
        END as trend
      FROM stock_prices sp
      WHERE sp.change_type IN ('buy', 'sell')
        AND sp.volume > 0
      ORDER BY sp.timestamp DESC
      LIMIT ?
    `;

    db.all(sql, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// 初始化股價（從數據庫載入最新價格）
async function initializeStockPrice() {
  // 先載入價格影響設置（簡化版本，暫時不從資料庫載入）
  console.log('使用預設價格影響設置:', priceImpactSettings);
  
  // 暫時使用預設價格，稍後可以從 Firestore 載入
  console.log(`使用預設Orange股價: $${currentPrice}`);
  return currentPrice;
}

module.exports = {
  getStockPrice,
  updateStockPrice,
  getStockPriceHistory,
  getStockStats,
  initializeStockPrice,
  getPriceImpactSettings,
  updatePriceImpactSettings,
  loadPriceImpactSettings,
  getTodayStockInfo,
  getFiveLevelQuotes,
  getRecentTrades
}; 