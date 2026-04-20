'use strict';

const ComboService = require('../services/combo.service');
const ApiResponse = require('../utils/apiResponse.util');

const ComboController = {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await ComboService.getAll()); }
    catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await ComboService.getById(req.params.id);
      if (!data) return ApiResponse.notFound(res, 'Không tìm thấy combo');
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
};
module.exports = ComboController;
