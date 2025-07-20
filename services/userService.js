const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'orange_stock_secret_2024';

// 使用記憶體儲存用戶（暫時方案）
const users = new Map();

// 註冊新用戶
function registerUser(username, email, password) {
  return new Promise(async (resolve, reject) => {
    try {
      // 檢查用戶是否已存在
      if (users.has(username)) {
        reject(new Error('用戶名已存在'));
        return;
      }
      
      // 檢查郵箱是否已存在
      for (const [_, user] of users) {
        if (user.email === email) {
          reject(new Error('郵箱已被註冊'));
          return;
        }
      }

      // 加密密碼
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 檢查是否為管理員用戶
      const role = username === 'wudodo' ? 'admin' : 'user';
      
      // 儲存用戶
      const userId = Date.now().toString();
      const userData = {
        id: userId,
        username,
        email,
        password_hash: hashedPassword,
        points: 1000.00,
        role,
        created_at: new Date()
      };
      
      users.set(username, userData);
      
      console.log('註冊成功:', username);
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
      const user = users.get(username);
      
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
  return new Promise((resolve, reject) => {
    for (const [_, user] of users) {
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
    reject(new Error('用戶不存在'));
  });
}

// 更新用戶點數
function updateUserPoints(userId, points, operation = 'set') {
  return new Promise((resolve, reject) => {
    let userFound = false;
    
    for (const [_, user] of users) {
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
  });
}

// 檢查用戶是否存在
function checkUserExists(username, email) {
  return Promise.resolve({
    userExists: users.has(username),
    emailExists: Array.from(users.values()).some(u => u.email === email)
  });
}

// 其他函數
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('無效的認證令牌');
  }
}

function getTopTraders(limit = 10) {
  return Promise.resolve([]);
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
  return Promise.resolve([]);
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