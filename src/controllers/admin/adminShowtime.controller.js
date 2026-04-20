'use strict';

const ShowtimeService = require('../../services/showtime.service');
const ApiResponse = require('../../utils/apiResponse.util');

const AdminShowtimeController = {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await ShowtimeService.getAll(req.query)); }
    catch (err) { next(err); }
  },
  /**
   * POST - Tạo suất chiếu mới với kiểm tra xung đột lịch
   */
  async create(req, res, next) {
    try { return ApiResponse.created(res, await ShowtimeService.create(req.body), 'Tạo suất chiếu thành công'); }
    catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { return ApiResponse.success(res, await ShowtimeService.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await ShowtimeService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa suất chiếu thành công');
    } catch (err) { next(err); }
  },
};
module.exports = AdminShowtimeController;
