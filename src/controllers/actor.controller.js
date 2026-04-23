'use strict';

const ActorService = require('../services/actor.service');
const ApiResponse = require('../utils/apiResponse.util');

const ActorController = {
  async getAll(req, res, next) {
    try {
      const data = await ActorService.getAll();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await ActorService.getById(req.params.id);
      if (!data) return ApiResponse.notFound(res);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  }
};

module.exports = ActorController;
