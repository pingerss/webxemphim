'use strict';

const CinemaService = require('../services/cinema.service');
const ApiResponse = require('../utils/apiResponse.util');

const CinemaController = {
  // Lấy thông tin rạp duy nhất (id=1)
  async getInfo(req, res, next) {
    try {
      const data = await CinemaService.getInfo();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  // Lấy danh sách phòng của rạp
  async getRooms(req, res, next) {
    try {
      const data = await CinemaService.getRooms();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
};

module.exports = CinemaController;
