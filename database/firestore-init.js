const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db = null;
let initialized = false;

// 初始化 Firestore
async function initFirestore() {
    if (initialized) {
        return db;
    }

    try {
        // 嘗試不同的方式初始化
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // 使用環境變數指定的憑證檔案
            admin.initializeApp();
        } else if (fs.existsSync(path.join(__dirname, '..', 'firestore-key.json'))) {
            // 使用本地憑證檔案
            try {
                const serviceAccount = require('../firestore-key.json');
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            } catch (error) {
                console.log('無法載入本地憑證，嘗試使用預設憑證');
                admin.initializeApp({
                    projectId: process.env.FIRESTORE_PROJECT_ID || 'orange-stock-a65bb'
                });
            }
        } else if (process.env.FIRESTORE_PROJECT_ID) {
            // 在 Cloud Run 上使用預設憑證
            admin.initializeApp({
                projectId: process.env.FIRESTORE_PROJECT_ID || 'orange-stock-a65bb'
            });
        } else {
            // 嘗試使用預設憑證（適用於 Cloud Run）
            admin.initializeApp();
        }

        db = admin.firestore();
        
        // 設置 Firestore 設定
        const settings = {
            ignoreUndefinedProperties: true,
        };
        db.settings(settings);

        initialized = true;
        console.log('✅ Firestore 初始化成功');
        
        // 初始化系統設定
        await initializeSystemSettings();
        
        return db;
    } catch (error) {
        console.error('❌ Firestore 初始化失敗:', error);
        throw error;
    }
}

// 初始化系統設定
async function initializeSystemSettings() {
    try {
        const settingsRef = db.collection('settings').doc('system');
        const doc = await settingsRef.get();
        
        if (!doc.exists) {
            // 創建初始設定
            await settingsRef.set({
                currentPrice: 100,
                openPrice: 100,
                dayHigh: 100,
                dayLow: 100,
                totalVolume: 0,
                lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
                priceImpactSettings: {
                    buyImpactMultiplier: 1.0,
                    sellImpactMultiplier: 0.5,
                    volumeDecayFactor: 1000,
                    randomFluctuation: 0.02
                }
            });
            console.log('✅ 系統設定初始化完成');
        }
    } catch (error) {
        console.error('系統設定初始化失敗:', error);
    }
}

// 獲取 Firestore 實例
function getFirestore() {
    if (!db) {
        throw new Error('Firestore 尚未初始化，請先調用 initFirestore()');
    }
    return db;
}

// 檢查是否使用 Firestore
function isFirestoreEnabled() {
    // 在 Cloud Run 上，只檢查環境變數
    if (process.env.FIRESTORE_ENABLED === 'true' || process.env.USE_FIRESTORE === 'true') {
        return true;
    }
    
    // 本地開發時，檢查憑證檔案
    if (process.env.NODE_ENV !== 'production' && fs.existsSync(path.join(__dirname, '..', 'firestore-key.json'))) {
        return true;
    }
    
    return false;
}

// 數據遷移工具：從 SQLite 到 Firestore
async function migrateFromSQLite(sqliteDb) {
    try {
        console.log('開始從 SQLite 遷移數據到 Firestore...');
        
        // 遷移用戶
        const users = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const batch = db.batch();
        let count = 0;
        
        for (const user of users) {
            const userRef = db.collection('users').doc(user.id.toString());
            batch.set(userRef, {
                ...user,
                createdAt: admin.firestore.Timestamp.fromDate(new Date(user.created_at))
            });
            count++;
            
            // Firestore 批次寫入限制為 500
            if (count >= 400) {
                await batch.commit();
                count = 0;
            }
        }
        
        if (count > 0) {
            await batch.commit();
        }
        
        console.log(`✅ 遷移了 ${users.length} 個用戶`);
        
        // 遷移交易記錄
        const transactions = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM transactions', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const transBatch = db.batch();
        count = 0;
        
        for (const trans of transactions) {
            const transRef = db.collection('transactions').doc();
            transBatch.set(transRef, {
                ...trans,
                timestamp: admin.firestore.Timestamp.fromDate(new Date(trans.created_at))
            });
            count++;
            
            if (count >= 400) {
                await transBatch.commit();
                count = 0;
            }
        }
        
        if (count > 0) {
            await transBatch.commit();
        }
        
        console.log(`✅ 遷移了 ${transactions.length} 筆交易`);
        
        return true;
    } catch (error) {
        console.error('數據遷移失敗:', error);
        return false;
    }
}

module.exports = {
    initFirestore,
    getFirestore,
    isFirestoreEnabled,
    migrateFromSQLite,
    admin
}; 