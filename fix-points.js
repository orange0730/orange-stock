const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 開始修復用戶點數問題...');

const dbPath = path.join(__dirname, 'data', 'orange_stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('數據庫連接失敗:', err.message);
        process.exit(1);
    }
    
    console.log('✅ 數據庫連接成功');
    
    // 1. 檢查當前用戶點數
    db.all("SELECT id, username, points FROM users", [], (err, rows) => {
        if (err) {
            console.error('查詢用戶失敗:', err.message);
            process.exit(1);
        }
        
        console.log('\n📊 當前用戶點數狀況:');
        rows.forEach(user => {
            console.log(`- ${user.username}: ${user.points} 點數`);
        });
        
        // 2. 重置所有負數點數為10000
        db.run(`
            UPDATE users 
            SET points = 10000 
            WHERE points < 0 OR points IS NULL
        `, function(err) {
            if (err) {
                console.error('重置點數失敗:', err.message);
                process.exit(1);
            }
            
            console.log(`\n✅ 已重置 ${this.changes} 個用戶的點數`);
            
            // 3. 確保所有用戶都有持股記錄
            db.run(`
                INSERT OR IGNORE INTO user_holdings (user_id, stock_symbol, shares, average_price, updated_at)
                SELECT id, 'ORANGE', 0, 0, CURRENT_TIMESTAMP
                FROM users
                WHERE id NOT IN (SELECT DISTINCT user_id FROM user_holdings WHERE stock_symbol = 'ORANGE')
            `, function(err) {
                if (err) {
                    console.error('創建持股記錄失敗:', err.message);
                    process.exit(1);
                }
                
                console.log(`✅ 已為 ${this.changes} 個用戶創建持股記錄`);
                
                // 4. 檢查修復後的狀況
                db.all("SELECT id, username, points FROM users", [], (err, rows) => {
                    if (err) {
                        console.error('查詢用戶失敗:', err.message);
                        process.exit(1);
                    }
                    
                    console.log('\n📊 修復後用戶點數狀況:');
                    rows.forEach(user => {
                        console.log(`- ${user.username}: ${user.points} 點數`);
                    });
                    
                    // 5. 檢查並確保wudodo是管理員
                    db.run(`
                        UPDATE users 
                        SET role = 'admin' 
                        WHERE username = 'wudodo' AND (role IS NULL OR role != 'admin')
                    `, function(err) {
                        if (err) {
                            console.error('設置管理員失敗:', err.message);
                        } else if (this.changes > 0) {
                            console.log('✅ wudodo用戶已設為管理員');
                        }
                        
                        console.log('\n🎉 點數修復完成！');
                        console.log('請重新啟動服務器：npm start');
                        
                        db.close();
                        process.exit(0);
                    });
                });
            });
        });
    });
}); 