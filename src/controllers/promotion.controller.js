'use strict';

const PromotionService = require('../services/promotion.service');
const ApiResponse = require('../utils/apiResponse.util');

const PromotionController = {
  async getActive(req, res, next) {
    try { return ApiResponse.success(res, await PromotionService.getActive()); }
    catch (err) { next(err); }
  },
  async validateVoucher(req, res, next) {
    try {
      const { code, amount } = req.body;
      const result = await PromotionService.validateVoucher(code, amount);
      return ApiResponse.success(res, result, 'Voucher hợp lệ');
    } catch (err) { next(err); }
  },
};
module.exports = PromotionController;
