'use strict';

const ShowtimeService = require('../services/showtime.service');
const ApiResponse = require('../utils/apiResponse.util');

const ShowtimeController = {
  async getAll(req, res, next) {
    try {
      const data = await ShowtimeService.getAll(req.query);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await ShowtimeService.getById(req.params.id);
      if (!data) return ApiResponse.notFound(res);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  /**
   * GET /showtimes/:id/seats
   * Trả về sơ đồ ghế kèm trạng thái: available / booked / held (từ Redis)
   */
  async getSeatMap(req, res, next) {
    try {
      const data = await ShowtimeService.getSeatMap(req.params.id);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
};

module.exports = ShowtimeController;
