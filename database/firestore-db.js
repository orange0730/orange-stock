const admin = require('firebase-admin');
const path = require('path');

let db = null;
let isInitialized = false;

// 初始化 Firestore
async function initFirestore() {
    try {
        if (isInitialized) {
            console.log('Firestore 已經初始化');
            return true;
        }

        const keyPath = process.env.FIRESTORE_KEY_PATH || './firestore-key.json';
        const projectId = process.env.FIRESTORE_PROJECT_ID || 'orange-stock-a65bb';
        
        console.log('正在初始化 Firestore...');
        console.log('金鑰路徑:', keyPath);
        console.log('專案 ID:', projectId);
        
        // 初始化 Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(require(path.resolve(keyPath))),
            projectId: projectId
        });
        
        db = admin.firestore();
        
        // 設定 Firestore
        const settings = {
            timestampsInSnapshots: true,
            ignoreUndefinedProperties: true
        };
        db.settings(settings);
        
        // 測試連接
        const testDoc = await db.collection('_test').doc('test').get();
        console.log('✅ Firestore 連接成功！');
        
        isInitialized = true;
        return true;
    } catch (error) {
        console.error('❌ Firestore 初始化失敗:', error.message);
        console.error('詳細錯誤:', error);
        return false;
    }
}

// 取得 Firestore 實例
function getFirestore() {
    if (!db) {
        throw new Error('Firestore 尚未初始化');
    }
    return db;
}

// 檢查是否已連接
function isConnected() {
    return isInitialized && db !== null;
}

// 用戶集合操作
const users = {
    async create(userData) {
        const docRef = db.collection('users').doc(userData.username);
        await docRef.set({
            ...userData,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, ...userData };
    },
    
    async findByUsername(username) {
        const doc = await db.collection('users').doc(username).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    
    async findByEmail(email) {
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },
    
    async findById(userId) {
        // 首先嘗試用 userId 作為文檔 ID
        const docById = await db.collection('users').doc(userId).get();
        if (docById.exists) {
            return { id: docById.id, ...docById.data() };
        }
        
        // 如果找不到，嘗試查詢 id 欄位
        const snapshot = await db.collection('users')
            .where('id', '==', userId)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },
    
    async updatePoints(username, points) {
        await db.collection('users').doc(username).update({
            points: points,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
    },
    
    async getTopTraders(limit = 10) {
        const snapshot = await db.collection('users')
            .orderBy('points', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            username: doc.id,
            points: doc.data().points
        }));
    }
};

// 交易記錄集合操作
const transactions = {
    async create(transactionData) {
        const docRef = await db.collection('transactions').add({
            ...transactionData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, ...transactionData };
    },
    
    async findByUserId(userId, limit = 10) {
        const snapshot = await db.collection('transactions')
            .where('user_id', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// 股票歷史集合操作
const stockHistory = {
    async create(historyData) {
        const docRef = await db.collection('stockHistory').add({
            ...historyData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, ...historyData };
    },
    
    async getLatest(limit = 50) {
        const snapshot = await db.collection('stockHistory')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// 限價單集合操作
const limitOrders = {
    async create(orderData) {
        const docRef = await db.collection('limitOrders').add({
            ...orderData,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        return { id: docRef.id, ...orderData };
    },
    
    async findPending() {
        const snapshot = await db.collection('limitOrders')
            .where('status', '==', 'pending')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    
    async updateStatus(orderId, status) {
        await db.collection('limitOrders').doc(orderId).update({
            status: status,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
    }
};

module.exports = {
    initFirestore,
    getFirestore,
    isConnected,
    collections: {
        users,
        transactions,
        stockHistory,
        limitOrders
    }
}; 