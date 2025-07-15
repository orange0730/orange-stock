const { getDb, isUsingFirestore } = require('./init');

// 創建限價單表
function createLimitOrdersTable() {
  return new Promise((resolve, reject) => {
    // 如果使用 Firestore，不需要創建表
    if (isUsingFirestore()) {
      console.log('使用 Firestore，無需創建限價單表');
      resolve();
      return;
    }

    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS limit_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_symbol VARCHAR(10) DEFAULT 'ORANGE',
        order_type VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        limit_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        cancelled_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    db.run(sql, (err) => {
      if (err) {
        console.error('創建限價單表失敗:', err.message);
        reject(err);
      } else {
        console.log('限價單表創建完成');
        resolve();
      }
    });
  });
}

module.exports = {
  createLimitOrdersTable
}; 