'use strict';

const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(422).json({ success: false, message: messages.join(', ') });
  }

  // Khóa ngoại không tồn tại (Ví dụ: truyền director_id / actor_id sai)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'ID cung cấp (như đạo diễn, diễn viên, thể loại...) không tồn tại trong hệ thống. Vui lòng kiểm tra lại!'
    });
  }

  // Lỗi nhập sai giá trị ENUM (như status, age_rating)
  if (err.name === 'SequelizeDatabaseError' && (err.message.includes('enum') || err.message.includes('truncated') || err.message.includes('Data truncated'))) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi: Giá trị nhập vào (Trạng thái phim, hoặc Độ tuổi) bị sai chính tả hoặc không hợp lệ. Vui lòng kiểm tra lại!'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
