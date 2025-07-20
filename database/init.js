const path = require('path');
const { isFirestoreEnabled, initFirestore } = require('./firestore-init');
const firestoreDB = require('./firestore-db');

// 延遲載入 sqlite3，只在需要時才載入
let sqlite3;
let db;
let useFirestore = false;

// 數據庫初始化
async function initDatabase() {
  // 嘗試連接 Firestore
  if (isFirestoreEnabled()) {
    try {
      const firestoreDB = require('./firestore-db');
      await firestoreDB.initFirestore();
      useFirestore = true;
      console.log('✅ 使用 Firestore 作為數據庫');
      return Promise.resolve();
    } catch (error) {
      console.error('Firestore 初始化失敗，回退到 SQLite:', error.message);
      useFirestore = false;
    }
  }
  
  // 暫時跳過 SQLite，使用記憶體儲存
  console.log('✅ 使用記憶體儲存（暫時方案）');
  return Promise.resolve();
}

// 創建所有必要的表
function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // 用戶表（添加角色字段）
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        points INTEGER DEFAULT 10000,
        orange_shares INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 股票價格歷史表
      `CREATE TABLE IF NOT EXISTS stock_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_symbol VARCHAR(10) DEFAULT 'ORANGE',
        price DECIMAL(10,2) NOT NULL,
        volume INTEGER DEFAULT 0,
        change_type VARCHAR(20),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 交易記錄表
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_symbol VARCHAR(10) DEFAULT 'ORANGE',
        transaction_type VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // 用戶持股表
      `CREATE TABLE IF NOT EXISTS user_holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_symbol VARCHAR(10) DEFAULT 'ORANGE',
        shares INTEGER NOT NULL DEFAULT 0,
        average_price DECIMAL(10,2) DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, stock_symbol)
      )`,

      // 系統設定表
      `CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_name VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 管理員設置表
      `CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users (id)
      )`
    ];

    let completedTables = 0;
    
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`創建表 ${index + 1} 失敗:`, err.message);
          reject(err);
        } else {
          completedTables++;
          if (completedTables === tables.length) {
            console.log('所有數據表創建完成');
            initializeDefaultData().then(resolve).catch(reject);
          }
        }
      });
    });
  });
}

// 初始化預設數據
function initializeDefaultData() {
  return new Promise((resolve, reject) => {
    // 設置初始股價為10
    const initialPrice = 10.00;
    
    // 檢查是否已有股價記錄
    db.get("SELECT COUNT(*) as count FROM stock_prices", (err, row) => {
      if (err) {
        reject(err);
      } else if (row.count === 0) {
        // 插入初始股價
        db.run(
          "INSERT INTO stock_prices (price, change_type) VALUES (?, ?)",
          [initialPrice, 'initial'],
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Orange股票初始價格設定為: $${initialPrice}`);
            }
          }
        );
      }
    });

    // 設置系統預設值
    const defaultSettings = [
      ['initial_user_points', '10000'],
      ['current_orange_price', initialPrice.toString()],
      ['total_orange_shares', '1000000']
    ];

    // 設置管理員系統預設值
    const adminDefaultSettings = [
      ['stock_initial_price', '10.00', '股票初始價格'],
      ['daily_reset_time', '00:00', '每日重置時間'],
      ['max_trade_quantity', '1000', '單次最大交易數量'],
      ['system_maintenance', 'false', '系統維護模式'],
      ['trading_enabled', 'true', '交易功能開關'],
      ['registration_enabled', 'true', '註冊功能開關']
    ];

    let settingsCompleted = 0;
    const totalSettings = defaultSettings.length + adminDefaultSettings.length;
    
    // 插入系統設定
    defaultSettings.forEach(([name, value]) => {
      db.run(
        "INSERT OR REPLACE INTO system_settings (setting_name, setting_value) VALUES (?, ?)",
        [name, value],
        (err) => {
          if (err) {
            console.error('設置系統預設值失敗:', err);
          } else {
            settingsCompleted++;
            checkCompletion();
          }
        }
      );
    });

    // 插入管理員設定
    adminDefaultSettings.forEach(([key, value, desc]) => {
      db.run(
        "INSERT OR IGNORE INTO admin_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
        [key, value, desc],
        (err) => {
          if (err) {
            console.error('設置管理員預設值失敗:', err);
          } else {
            settingsCompleted++;
            checkCompletion();
          }
        }
      );
    });

    function checkCompletion() {
      if (settingsCompleted === totalSettings) {
        console.log('系統預設值設置完成');
        
        // 設置wudodo用戶為管理員
        db.run(`
          UPDATE users SET role = 'admin' WHERE username = 'wudodo'
        `, (err) => {
          if (err) {
            console.log('wudodo用戶不存在，管理員設置將在用戶註冊時生效');
          } else {
            console.log('✅ wudodo用戶已設為管理員');
          }
          resolve();
        });
      }
    }
  });
}

// 獲取數據庫實例
function getDb() {
  if (useFirestore) {
    // 返回實際的 Firestore 實例
    const { getFirestore } = require('./firestore-init');
    try {
      return getFirestore();
    } catch (error) {
      console.error('獲取 Firestore 實例失敗:', error);
      return null;
    }
  }
  return db;
}

// 關閉數據庫連接
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('關閉數據庫失敗:', err.message);
      } else {
        console.log('數據庫連接已關閉');
      }
    });
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  isUsingFirestore: () => useFirestore
};