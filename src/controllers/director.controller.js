'use strict';

const DirectorService = require('../services/director.service');
const ApiResponse = require('../utils/apiResponse.util');

const DirectorController = {
  async getAll(req, res, next) {
    try {
      const data = await DirectorService.getAll();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await DirectorService.getById(req.params.id);
      if (!data) return ApiResponse.notFound(res);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  }
};

module.exports = DirectorController;
