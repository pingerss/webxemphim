'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware xác thực JWT.
 * Đọc token từ Authorization: Bearer <token>
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khoá.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token hết hạn, vui lòng đăng nhập lại.' });
    }
    return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
}

/**
 * Middleware phân quyền theo role.
 * Sử dụng sau authenticate.
 * @param {...string} roles - Các role được phép: 'admin', 'customer'
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
