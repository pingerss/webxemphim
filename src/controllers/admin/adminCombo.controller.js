'use strict';

const ComboService = require('../../services/combo.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

const AdminComboController = {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await ComboService.getAll()); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'combos');
        payload.image_url = r.secure_url;
      }
      return ApiResponse.created(res, await ComboService.create(payload), 'Thêm combo thành công');
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'combos');
        payload.image_url = r.secure_url;
      }
      return ApiResponse.success(res, await ComboService.update(req.params.id, payload), 'Cập nhật combo thành công');
    } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await ComboService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa combo thành công');
    } catch (err) { next(err); }
  },
};
module.exports = AdminComboController;
