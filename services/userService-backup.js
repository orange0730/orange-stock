const { getDb } = require('../database/init');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'orange_stock_secret_2024';

// 註冊新用戶
function registerUser(username, email, password) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = getDb();
      if (!db) {
        reject(new Error('數據庫未連接'));
        return;
      }

      // 檢查用戶是否已存在
      const existingUser = await checkUserExists(username, email);
      if (existingUser.userExists) {
        reject(new Error('用戶名已存在'));
        return;
      }
      if (existingUser.emailExists) {
        reject(new Error('郵箱已被註冊'));
        return;
      }

      // 加密密碼
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 檢查是否為管理員用戶
      const role = username === 'wudodo' ? 'admin' : 'user';

      // 插入新用戶
      db.run(
        `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, role],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const userId = this.lastID;
            
            // 為新用戶創建持股記錄
            db.run(
              `INSERT INTO user_holdings (user_id, stock_symbol, shares, average_price) 
               VALUES (?, 'ORANGE', 0, 0)`,
              [userId],
              (err) => {
                if (err) {
                  console.error('創建用戶持股記錄失敗:', err);
                }
              }
            );

            console.log(`✅ 新用戶註冊成功: ${username}${role === 'admin' ? ' (管理員)' : ''}`);
            resolve({
              success: true,
              userId: userId,
              username: username,
              role: role,
              message: '註冊成功'
            });
          }
        }
      );

    } catch (error) {
      reject(error);
    }
  });
}

// 用戶登入
function loginUser(username, password) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    // 查找用戶
    db.get(
      "SELECT id, username, email, password_hash, role FROM users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('用戶不存在'));
        } else {
          try {
            // 驗證密碼
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
              reject(new Error('密碼錯誤'));
            } else {
              // 生成JWT token
              const token = jwt.sign(
                { 
                  userId: user.id, 
                  username: user.username,
                  role: user.role 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
              );

              console.log(`✅ 用戶登入成功: ${username}${user.role === 'admin' ? ' (管理員)' : ''}`);

              resolve({
                success: true,
                message: '登入成功',
                token: token,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  role: user.role
                }
              });
            }
          } catch (error) {
            reject(error);
          }
        }
      }
    );
  });
}

// 檢查用戶是否存在
function checkUserExists(username, email) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    // 分別檢查用戶名和郵箱
    db.get(
      "SELECT username, email FROM users WHERE username = ? OR email = ?",
      [username, email],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            userExists: row && row.username === username,
            emailExists: row && row.email === email
          });
        }
      }
    );
  });
}

// 獲取用戶餘額和持股
function getUserBalance(userId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    db.get(
      `SELECT u.points, 
              COALESCE(uh.shares, 0) as orangeShares,
              COALESCE(uh.average_price, 0) as averagePrice
       FROM users u 
       LEFT JOIN user_holdings uh ON u.id = uh.user_id AND uh.stock_symbol = 'ORANGE'
       WHERE u.id = ?`,
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('用戶不存在'));
        } else {
          resolve({
            points: row.points || 10000,
            orangeShares: row.orangeShares || 0,
            averagePrice: row.averagePrice || 0
          });
        }
      }
    );
  });
}

// 更新用戶餘額
function updateUserBalance(userId, pointsChange, sharesChange) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 更新點數
      db.run(
        "UPDATE users SET points = points + ? WHERE id = ?",
        [pointsChange, userId],
        function(err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
            return;
          }
        }
      );

      // 更新持股
      if (sharesChange !== 0) {
        db.run(
          `INSERT OR REPLACE INTO user_holdings (user_id, stock_symbol, shares, updated_at)
           VALUES (?, 'ORANGE', 
             COALESCE((SELECT shares FROM user_holdings WHERE user_id = ? AND stock_symbol = 'ORANGE'), 0) + ?,
             CURRENT_TIMESTAMP)`,
          [userId, userId, sharesChange],
          function(err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }
          }
        );
      }

      db.run("COMMIT", (err) => {
        if (err) {
          db.run("ROLLBACK");
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}

// 獲取用戶交易歷史
function getUserTransactions(userId, limit = 50) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    db.all(
      `SELECT transaction_type, quantity, price, total_amount, timestamp
       FROM transactions 
       WHERE user_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// 獲取用戶點數排行榜
function getUserRankings(limit = 10) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    const sql = `
      SELECT 
        u.id,
        u.username,
        u.points,
        COALESCE(h.shares, 0) as shares,
        (u.points + COALESCE(h.shares, 0) * ?) as total_value,
        u.created_at,
        (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as trade_count
      FROM users u
      LEFT JOIN user_holdings h ON u.id = h.user_id
      ORDER BY total_value DESC
      LIMIT ?
    `;

    // 需要當前股價來計算總資產
    const { getStockPrice } = require('./stockService');
    const currentPrice = getStockPrice();

    db.all(sql, [currentPrice, limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const rankings = rows.map((row, index) => ({
          rank: index + 1,
          userId: row.id,
          username: row.username,
          points: row.points,
          shares: row.shares,
          stockValue: row.shares * currentPrice,
          totalValue: row.total_value,
          tradeCount: row.trade_count,
          joinDate: row.created_at
        }));
        resolve(rankings);
      }
    });
  });
}

// 獲取用戶在排行榜中的排名
function getUserRank(userId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    if (!db) {
      reject(new Error('數據庫未連接'));
      return;
    }

    const sql = `
      WITH ranked_users AS (
        SELECT 
          u.id,
          u.username,
          u.points,
          COALESCE(h.shares, 0) as shares,
          (u.points + COALESCE(h.shares, 0) * ?) as total_value,
          ROW_NUMBER() OVER (ORDER BY (u.points + COALESCE(h.shares, 0) * ?) DESC) as rank
        FROM users u
        LEFT JOIN user_holdings h ON u.id = h.user_id
      )
      SELECT rank, total_value
      FROM ranked_users
      WHERE id = ?
    `;

    const { getStockPrice } = require('./stockService');
    const currentPrice = getStockPrice();

    db.get(sql, [currentPrice, currentPrice, userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || { rank: null, total_value: 0 });
      }
    });
  });
}

// 驗證JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { 
      success: true, 
      userId: decoded.userId, 
      username: decoded.username,
      role: decoded.role || 'user'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserBalance,
  updateUserBalance,
  getUserTransactions,
  verifyToken,
  getUserRankings,
  getUserRank
}; 