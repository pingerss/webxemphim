'use strict';

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { notFoundHandler };
