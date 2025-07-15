const { getFirestore, admin } = require('./firestore-init');

// 模擬 SQLite 的 db.get 方法
function get(collection, query, callback) {
    const db = getFirestore();
    
    db.collection(collection)
        .where(query.field, query.operator || '==', query.value)
        .limit(1)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                callback(null, null);
            } else {
                const doc = snapshot.docs[0];
                callback(null, { id: doc.id, ...doc.data() });
            }
        })
        .catch(error => callback(error));
}

// 模擬 SQLite 的 db.all 方法
function all(collection, query, callback) {
    const db = getFirestore();
    let queryRef = db.collection(collection);
    
    // 處理查詢條件
    if (query) {
        if (query.where) {
            query.where.forEach(condition => {
                queryRef = queryRef.where(condition.field, condition.operator || '==', condition.value);
            });
        }
        if (query.orderBy) {
            queryRef = queryRef.orderBy(query.orderBy.field, query.orderBy.direction || 'asc');
        }
        if (query.limit) {
            queryRef = queryRef.limit(query.limit);
        }
    }
    
    queryRef.get()
        .then(snapshot => {
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            callback(null, results);
        })
        .catch(error => callback(error));
}

// 模擬 SQLite 的 db.run 方法（插入/更新/刪除）
function run(operation, callback) {
    const db = getFirestore();
    
    switch (operation.type) {
        case 'insert':
            const docData = { ...operation.data };
            if (!docData.id) {
                // 自動生成 ID
                db.collection(operation.collection).add({
                    ...docData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                })
                .then(docRef => callback(null, { lastID: docRef.id }))
                .catch(error => callback(error));
            } else {
                // 使用指定的 ID
                const id = docData.id;
                delete docData.id;
                db.collection(operation.collection).doc(id.toString()).set({
                    ...docData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                })
                .then(() => callback(null, { lastID: id }))
                .catch(error => callback(error));
            }
            break;
            
        case 'update':
            db.collection(operation.collection).doc(operation.id.toString()).update({
                ...operation.data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            })
            .then(() => callback(null, { changes: 1 }))
            .catch(error => callback(error));
            break;
            
        case 'delete':
            db.collection(operation.collection).doc(operation.id.toString()).delete()
            .then(() => callback(null, { changes: 1 }))
            .catch(error => callback(error));
            break;
            
        default:
            callback(new Error('不支援的操作類型'));
    }
}

// 創建用戶相關的包裝函數
const firestoreDB = {
    // 用戶操作
    getUserByUsername: (username, callback) => {
        get('users', { field: 'username', value: username }, callback);
    },
    
    getUserByEmail: (email, callback) => {
        get('users', { field: 'email', value: email }, callback);
    },
    
    getUserById: (id, callback) => {
        const db = getFirestore();
        db.collection('users').doc(id.toString()).get()
            .then(doc => {
                if (doc.exists) {
                    callback(null, { id: doc.id, ...doc.data() });
                } else {
                    callback(null, null);
                }
            })
            .catch(error => callback(error));
    },
    
    createUser: (userData, callback) => {
        run({
            type: 'insert',
            collection: 'users',
            data: userData
        }, callback);
    },
    
    updateUser: (id, updates, callback) => {
        run({
            type: 'update',
            collection: 'users',
            id: id,
            data: updates
        }, callback);
    },
    
    // 交易操作
    createTransaction: (transData, callback) => {
        run({
            type: 'insert',
            collection: 'transactions',
            data: {
                ...transData,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }
        }, callback);
    },
    
    getUserTransactions: (userId, limit, callback) => {
        all('transactions', {
            where: [{ field: 'userId', value: userId.toString() }],
            orderBy: { field: 'timestamp', direction: 'desc' },
            limit: limit
        }, callback);
    },
    
    // 股價歷史
    addPriceHistory: (price, volume, callback) => {
        run({
            type: 'insert',
            collection: 'stockHistory',
            data: {
                price: price,
                volume: volume,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }
        }, callback);
    },
    
    getPriceHistory: (limit, callback) => {
        all('stockHistory', {
            orderBy: { field: 'timestamp', direction: 'desc' },
            limit: limit
        }, callback);
    },
    
    // 系統設定
    getSystemSettings: async () => {
        const db = getFirestore();
        const doc = await db.collection('settings').doc('system').get();
        return doc.exists ? doc.data() : null;
    },
    
    updateSystemSettings: async (updates) => {
        const db = getFirestore();
        await db.collection('settings').doc('system').update({
            ...updates,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp()
        });
    },
    
    // 統計資料
    getStats: async () => {
        const db = getFirestore();
        const stats = {};
        
        // 用戶統計
        const usersSnapshot = await db.collection('users').get();
        stats.totalUsers = usersSnapshot.size;
        stats.adminUsers = usersSnapshot.docs.filter(doc => doc.data().role === 'admin').length;
        
        // 交易統計
        const transSnapshot = await db.collection('transactions').get();
        stats.totalTransactions = transSnapshot.size;
        
        // 今日統計
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
        
        const todayUsers = await db.collection('users')
            .where('createdAt', '>=', todayTimestamp)
            .get();
        stats.newUsersToday = todayUsers.size;
        
        const todayTrans = await db.collection('transactions')
            .where('timestamp', '>=', todayTimestamp)
            .get();
        stats.transactionsToday = todayTrans.size;
        
        return stats;
    }
};

module.exports = firestoreDB; 