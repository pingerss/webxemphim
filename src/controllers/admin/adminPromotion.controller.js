'use strict';

const PromotionService = require('../../services/promotion.service');
const ApiResponse = require('../../utils/apiResponse.util');

const AdminPromotionController = {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await PromotionService.getAll()); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { return ApiResponse.created(res, await PromotionService.create(req.body), 'Tạo khuyến mãi thành công'); }
    catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { return ApiResponse.success(res, await PromotionService.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await PromotionService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa khuyến mãi thành công');
    } catch (err) { next(err); }
  },
  /**
   * Tạo hàng loạt voucher từ promotion
   * Body: { count: 100, prefix: 'TET2025' }
   */
  async generateVouchers(req, res, next) {
    try {
      const data = await PromotionService.generateVouchers(req.params.id, req.body);
      return ApiResponse.created(res, data, `Đã tạo ${data.length} voucher`);
    } catch (err) { next(err); }
  },
};
module.exports = AdminPromotionController;
