const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// 管理員身份驗證中間件
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: '需要管理員權限' });
    }
    next();
}

// 導出所有數據
router.get('/export', authenticateToken, requireAdmin, (req, res) => {
    const db = getDb();
    const data = {
        exportTime: new Date().toISOString(),
        version: '1.0',
        users: [],
        transactions: [],
        stock_history: [],
        limit_orders: []
    };
    
    // 導出用戶資料
    db.all('SELECT * FROM users', (err, users) => {
        if (err) return res.status(500).json({ error: '導出用戶失敗' });
        data.users = users;
        
        // 導出交易記錄
        db.all('SELECT * FROM transactions ORDER BY created_at DESC', (err, transactions) => {
            if (err) return res.status(500).json({ error: '導出交易記錄失敗' });
            data.transactions = transactions;
            
            // 導出股價歷史
            db.all('SELECT * FROM stock_history ORDER BY timestamp DESC', (err, history) => {
                if (err) return res.status(500).json({ error: '導出股價歷史失敗' });
                data.stock_history = history;
                
                // 導出限價訂單
                db.all('SELECT * FROM limit_orders WHERE status = "pending"', (err, orders) => {
                    if (err) return res.status(500).json({ error: '導出限價訂單失敗' });
                    data.limit_orders = orders;
                    
                    // 設置下載headers
                    const filename = `orange_stock_backup_${new Date().toISOString().split('T')[0]}.json`;
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    
                    res.json(data);
                });
            });
        });
    });
});

// 導入數據
router.post('/import', authenticateToken, requireAdmin, (req, res) => {
    const data = req.body;
    const db = getDb();
    
    if (!data.version || !data.users || !data.transactions) {
        return res.status(400).json({ error: '無效的備份檔案格式' });
    }
    
    // 開始事務
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        try {
            // 清空現有數據（可選）
            if (req.body.clearExisting) {
                db.run('DELETE FROM transactions');
                db.run('DELETE FROM stock_history');
                db.run('DELETE FROM limit_orders');
                // 保留用戶資料，只更新
            }
            
            // 導入用戶（更新現有用戶）
            const userStmt = db.prepare(`
                INSERT OR REPLACE INTO users (id, username, email, password, points, shares, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            data.users.forEach(user => {
                userStmt.run(
                    user.id, user.username, user.email, user.password,
                    user.points, user.shares, user.role, user.created_at
                );
            });
            userStmt.finalize();
            
            // 導入交易記錄
            const transStmt = db.prepare(`
                INSERT INTO transactions (user_id, type, quantity, price, total_value, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            data.transactions.forEach(trans => {
                transStmt.run(
                    trans.user_id, trans.type, trans.quantity,
                    trans.price, trans.total_value, trans.created_at
                );
            });
            transStmt.finalize();
            
            // 導入股價歷史
            if (data.stock_history && data.stock_history.length > 0) {
                const historyStmt = db.prepare(`
                    INSERT INTO stock_history (price, volume, timestamp)
                    VALUES (?, ?, ?)
                `);
                
                data.stock_history.forEach(record => {
                    historyStmt.run(record.price, record.volume, record.timestamp);
                });
                historyStmt.finalize();
            }
            
            // 提交事務
            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: '導入失敗：' + err.message });
                }
                
                res.json({
                    success: true,
                    imported: {
                        users: data.users.length,
                        transactions: data.transactions.length,
                        stock_history: data.stock_history ? data.stock_history.length : 0
                    }
                });
            });
            
        } catch (error) {
            db.run('ROLLBACK');
            res.status(500).json({ error: '導入過程中發生錯誤：' + error.message });
        }
    });
});

// 獲取數據庫統計
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const db = getDb();
    const stats = {};
    
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        stats.users = result.count;
        
        db.get('SELECT COUNT(*) as count FROM transactions', (err, result) => {
            stats.transactions = result.count;
            
            db.get('SELECT COUNT(*) as count FROM stock_history', (err, result) => {
                stats.stock_history = result.count;
                
                db.get('SELECT COUNT(*) as count FROM limit_orders WHERE status = "pending"', (err, result) => {
                    stats.pending_orders = result.count;
                    
                    // 獲取數據庫檔案大小
                    const fs = require('fs');
                    const path = require('path');
                    const dbPath = path.join(__dirname, '..', 'data', 'orange_stock.db');
                    
                    fs.stat(dbPath, (err, fileStats) => {
                        if (!err) {
                            stats.database_size = (fileStats.size / 1024 / 1024).toFixed(2) + ' MB';
                        }
                        
                        res.json(stats);
                    });
                });
            });
        });
    });
});

module.exports = router; 