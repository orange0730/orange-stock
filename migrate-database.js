const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 數據庫遷移腳本
function migrateDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'data', 'orange_stock.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('數據庫連接失敗:', err.message);
                reject(err);
                return;
            }
            
            console.log('🔄 開始數據庫遷移...');
            
            // 執行遷移步驟
            db.serialize(() => {
                // 1. 檢查role列是否存在，如果不存在則添加
                db.run(`
                    ALTER TABLE users 
                    ADD COLUMN role TEXT DEFAULT 'user'
                `, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('添加role列失敗:', err.message);
                    } else {
                        console.log('✅ 已添加role列到users表');
                    }
                });

                // 2. 創建admin_settings表
                db.run(`
                    CREATE TABLE IF NOT EXISTS admin_settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        setting_key TEXT UNIQUE NOT NULL,
                        setting_value TEXT NOT NULL,
                        description TEXT,
                        updated_by INTEGER,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (updated_by) REFERENCES users (id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('創建admin_settings表失敗:', err.message);
                    } else {
                        console.log('✅ 已創建admin_settings表');
                    }
                });

                // 3. 設置wudodo用戶為管理員
                db.run(`
                    UPDATE users SET role = 'admin' WHERE username = 'wudodo'
                `, (err) => {
                    if (err) {
                        console.log('ℹ️ wudodo用戶不存在，將在註冊時設為管理員');
                    } else {
                        console.log('✅ 已設置wudodo為管理員');
                    }
                });

                // 4. 插入默認管理員設置
                const defaultSettings = [
                    ['stock_initial_price', '10.00', '股票初始價格'],
                    ['daily_reset_time', '00:00', '每日重置時間'],
                    ['max_trade_quantity', '1000', '單次最大交易數量'],
                    ['system_maintenance', 'false', '系統維護模式'],
                    ['trading_enabled', 'true', '交易功能開關'],
                    ['registration_enabled', 'true', '註冊功能開關']
                ];

                defaultSettings.forEach(([key, value, desc]) => {
                    db.run(`
                        INSERT OR IGNORE INTO admin_settings (setting_key, setting_value, description)
                        VALUES (?, ?, ?)
                    `, [key, value, desc], (err) => {
                        if (err) {
                            console.error(`設置${key}失敗:`, err.message);
                        }
                    });
                });

                // 5. 更新股價為10
                db.run(`
                    UPDATE system_settings SET setting_value = '10.00' 
                    WHERE setting_name = 'current_orange_price'
                `, (err) => {
                    if (err) {
                        console.error('更新股價失敗:', err.message);
                    } else {
                        console.log('✅ 已更新股價為10元');
                    }
                });

                // 6. 插入初始股價記錄（如果不存在）
                db.run(`
                    INSERT OR IGNORE INTO stock_prices (price, change_type) 
                    VALUES (10.00, 'initial')
                `, (err) => {
                    if (err) {
                        console.error('插入初始股價失敗:', err.message);
                    } else {
                        console.log('✅ 已設置初始股價記錄');
                    }
                });

                console.log('🎉 數據庫遷移完成！');
                db.close((err) => {
                    if (err) {
                        console.error('關閉數據庫失敗:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ 數據庫連接已關閉');
                        resolve();
                    }
                });
            });
        });
    });
}

// 執行遷移
if (require.main === module) {
    migrateDatabase()
        .then(() => {
            console.log('✅ 遷移成功完成！現在可以重新啟動服務器。');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 遷移失敗:', error.message);
            process.exit(1);
        });
}

module.exports = { migrateDatabase }; 