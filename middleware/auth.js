const jwt = require('jsonwebtoken');

// JWT secret key (在生產環境中應該使用環境變數)
const JWT_SECRET = process.env.JWT_SECRET || 'orange-stock-secret-key-2024';

// 驗證 JWT token 的中間件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供認證令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '認證令牌無效或已過期' });
    }
    req.user = user;
    next();
  });
}

// 驗證管理員權限的中間件
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: '需要管理員權限' });
    }
  });
}

module.exports = {
  authenticateToken,
  authenticateAdmin
};