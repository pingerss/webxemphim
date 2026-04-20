'use strict';

/**
 * Tạo response chuẩn hóa cho toàn bộ API.
 */
const ApiResponse = {
  success(res, data = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  },
  created(res, data = null, message = 'Tạo thành công') {
    return res.status(201).json({ success: true, message, data });
  },
  error(res, message = 'Lỗi máy chủ', statusCode = 500, errors = null) {
    return res.status(statusCode).json({ success: false, message, errors });
  },
  notFound(res, message = 'Không tìm thấy dữ liệu') {
    return res.status(404).json({ success: false, message });
  },
  unauthorized(res, message = 'Chưa đăng nhập') {
    return res.status(401).json({ success: false, message });
  },
  forbidden(res, message = 'Không có quyền truy cập') {
    return res.status(403).json({ success: false, message });
  },
  paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({ success: true, message, data, pagination });
  },
};

module.exports = ApiResponse;
