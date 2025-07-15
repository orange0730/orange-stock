const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getContainer, isConnected } = require('../database/cosmos-db');

const JWT_SECRET = process.env.JWT_SECRET || 'orange_stock_secret_2024';

// 記憶體快取
const userCache = new Map();

// 註冊新用戶
function registerUser(username, email, password) {
    return new Promise(async (resolve, reject) => {
        try {
            const usersContainer = getContainer('users');
            
            if (!isConnected() || !usersContainer) {
                // 使用記憶體儲存作為備援
                return registerUserMemory(username, email, password, resolve, reject);
            }
            
            // 檢查用戶是否已存在
            const { resources: existingUsers } = await usersContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.username = @username OR c.email = @email',
                    parameters: [
                        { name: '@username', value: username },
                        { name: '@email', value: email }
                    ]
                })
                .fetchAll();
            
            if (existingUsers.length > 0) {
                if (existingUsers.some(u => u.username === username)) {
                    reject(new Error('用戶名已存在'));
                } else {
                    reject(new Error('郵箱已被註冊'));
                }
                return;
            }
            
            // 加密密碼
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // 檢查是否為管理員用戶
            const role = username === 'wudodo' ? 'admin' : 'user';
            
            // 創建用戶文檔
            const userId = Date.now().toString();
            const userData = {
                id: userId,
                username,
                email,
                password_hash: hashedPassword,
                points: 1000.00,
                role,
                created_at: new Date().toISOString()
            };
            
            // 儲存到 Cosmos DB
            await usersContainer.items.create(userData);
            
            // 更新快取
            userCache.set(username, userData);
            
            console.log('註冊成功 (Cosmos DB):', username);
            resolve({ 
                id: userId, 
                username,
                role,
                message: '註冊成功' 
            });
        } catch (error) {
            console.error('註冊錯誤:', error);
            reject(error);
        }
    });
}

// 用戶登入
function loginUser(username, password) {
    return new Promise(async (resolve, reject) => {
        try {
            let user;
            
            // 先檢查快取
            if (userCache.has(username)) {
                user = userCache.get(username);
            } else if (isConnected()) {
                // 從 Cosmos DB 查詢
                const usersContainer = getContainer('users');
                const { resources } = await usersContainer.items
                    .query({
                        query: 'SELECT * FROM c WHERE c.username = @username',
                        parameters: [{ name: '@username', value: username }]
                    })
                    .fetchAll();
                
                if (resources.length > 0) {
                    user = resources[0];
                    userCache.set(username, user);
                }
            }
            
            if (!user) {
                reject(new Error('用戶名或密碼錯誤'));
                return;
            }
            
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                reject(new Error('用戶名或密碼錯誤'));
                return;
            }
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            console.log('登入成功:', username);
            resolve({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    points: user.points,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('登入錯誤:', error);
            reject(error);
        }
    });
}

// 獲取用戶資訊
function getUserInfo(userId) {
    return new Promise(async (resolve, reject) => {
        try {
            // 先檢查快取
            for (const [_, user] of userCache) {
                if (user.id === userId) {
                    resolve({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        points: user.points,
                        role: user.role
                    });
                    return;
                }
            }
            
            // 從 Cosmos DB 查詢
            if (isConnected()) {
                const usersContainer = getContainer('users');
                const { resources } = await usersContainer.items
                    .query({
                        query: 'SELECT * FROM c WHERE c.id = @userId',
                        parameters: [{ name: '@userId', value: userId }]
                    })
                    .fetchAll();
                
                if (resources.length > 0) {
                    const user = resources[0];
                    userCache.set(user.username, user);
                    resolve({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        points: user.points,
                        role: user.role
                    });
                    return;
                }
            }
            
            reject(new Error('用戶不存在'));
        } catch (error) {
            console.error('獲取用戶資訊錯誤:', error);
            reject(error);
        }
    });
}

// 更新用戶點數
function updateUserPoints(userId, points, operation = 'set') {
    return new Promise(async (resolve, reject) => {
        try {
            const usersContainer = getContainer('users');
            
            if (!isConnected() || !usersContainer) {
                // 使用記憶體更新
                return updateUserPointsMemory(userId, points, operation, resolve, reject);
            }
            
            // 查詢用戶
            const { resources } = await usersContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.id = @userId',
                    parameters: [{ name: '@userId', value: userId }]
                })
                .fetchAll();
            
            if (resources.length === 0) {
                reject(new Error('用戶不存在'));
                return;
            }
            
            const user = resources[0];
            let newPoints;
            
            if (operation === 'add') {
                newPoints = user.points + points;
            } else if (operation === 'subtract') {
                newPoints = user.points - points;
            } else {
                newPoints = points;
            }
            
            if (newPoints < 0) {
                reject(new Error('點數不足'));
                return;
            }
            
            // 更新點數
            user.points = newPoints;
            await usersContainer.item(user.id, user.username).replace(user);
            
            // 更新快取
            userCache.set(user.username, user);
            
            resolve({ success: true, newPoints });
        } catch (error) {
            console.error('更新點數錯誤:', error);
            reject(error);
        }
    });
}

// 檢查用戶是否存在
function checkUserExists(username, email) {
    return new Promise(async (resolve) => {
        try {
            if (!isConnected()) {
                // 使用記憶體檢查
                resolve({
                    userExists: userCache.has(username),
                    emailExists: Array.from(userCache.values()).some(u => u.email === email)
                });
                return;
            }
            
            const usersContainer = getContainer('users');
            const { resources } = await usersContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.username = @username OR c.email = @email',
                    parameters: [
                        { name: '@username', value: username },
                        { name: '@email', value: email }
                    ]
                })
                .fetchAll();
            
            resolve({
                userExists: resources.some(u => u.username === username),
                emailExists: resources.some(u => u.email === email)
            });
        } catch (error) {
            console.error('檢查用戶存在錯誤:', error);
            resolve({ userExists: false, emailExists: false });
        }
    });
}

// 獲取交易排行榜
function getTopTraders(limit = 10) {
    return new Promise(async (resolve) => {
        try {
            if (!isConnected()) {
                resolve([]);
                return;
            }
            
            const usersContainer = getContainer('users');
            const { resources } = await usersContainer.items
                .query({
                    query: 'SELECT c.username, c.points FROM c ORDER BY c.points DESC OFFSET 0 LIMIT @limit',
                    parameters: [{ name: '@limit', value: limit }]
                })
                .fetchAll();
            
            resolve(resources);
        } catch (error) {
            console.error('獲取排行榜錯誤:', error);
            resolve([]);
        }
    });
}

// 記憶體儲存備援函數
function registerUserMemory(username, email, password, resolve, reject) {
    // 檢查用戶是否已存在
    if (userCache.has(username)) {
        reject(new Error('用戶名已存在'));
        return;
    }
    
    // 檢查郵箱是否已存在
    for (const [_, user] of userCache) {
        if (user.email === email) {
            reject(new Error('郵箱已被註冊'));
            return;
        }
    }
    
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            reject(err);
            return;
        }
        
        const role = username === 'wudodo' ? 'admin' : 'user';
        const userId = Date.now().toString();
        const userData = {
            id: userId,
            username,
            email,
            password_hash: hashedPassword,
            points: 1000.00,
            role,
            created_at: new Date().toISOString()
        };
        
        userCache.set(username, userData);
        
        console.log('註冊成功 (記憶體):', username);
        resolve({ 
            id: userId, 
            username,
            role,
            message: '註冊成功' 
        });
    });
}

function updateUserPointsMemory(userId, points, operation, resolve, reject) {
    let userFound = false;
    
    for (const [_, user] of userCache) {
        if (user.id === userId) {
            userFound = true;
            let newPoints;
            
            if (operation === 'add') {
                newPoints = user.points + points;
            } else if (operation === 'subtract') {
                newPoints = user.points - points;
            } else {
                newPoints = points;
            }
            
            if (newPoints < 0) {
                reject(new Error('點數不足'));
                return;
            }
            
            user.points = newPoints;
            resolve({ success: true, newPoints });
            return;
        }
    }
    
    if (!userFound) {
        reject(new Error('用戶不存在'));
    }
}

// 其他輔助函數
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('無效的認證令牌');
    }
}

function getUserHoldings(userId) {
    return Promise.resolve({
        stock_symbol: 'ORANGE',
        shares: 0,
        average_price: 0,
        current_value: 0,
        profit_loss: 0,
        profit_loss_percent: 0
    });
}

function getUserTransactions(userId, limit = 10) {
    return new Promise(async (resolve) => {
        try {
            if (!isConnected()) {
                resolve([]);
                return;
            }
            
            const transactionsContainer = getContainer('transactions');
            const { resources } = await transactionsContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
                    parameters: [
                        { name: '@userId', value: userId },
                        { name: '@limit', value: limit }
                    ]
                })
                .fetchAll();
            
            resolve(resources);
        } catch (error) {
            console.error('獲取交易記錄錯誤:', error);
            resolve([]);
        }
    });
}

function getUserPosition(userId, currentPrice) {
    return Promise.resolve({
        shares: 0,
        average_price: 0,
        current_value: 0,
        profit_loss: 0,
        profit_loss_percent: 0
    });
}

module.exports = {
    registerUser,
    loginUser,
    getUserInfo,
    updateUserPoints,
    verifyToken,
    getTopTraders,
    getUserHoldings,
    getUserTransactions,
    getUserPosition,
    checkUserExists
}; 