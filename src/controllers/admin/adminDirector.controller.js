'use strict';

const DirectorService = require('../../services/director.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

const AdminDirectorController = {
  async getAll(req, res, next) {
    try {
      const data = await DirectorService.getAll();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'directors');
        payload.avatar_url = r.secure_url;
      }
      const data = await DirectorService.create(payload);
      return ApiResponse.created(res, data, 'Thêm đạo diễn thành công');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'directors');
        payload.avatar_url = r.secure_url;
      }
      const data = await DirectorService.update(req.params.id, payload);
      return ApiResponse.success(res, data, 'Cập nhật đạo diễn thành công');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await DirectorService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa đạo diễn thành công');
    } catch (err) { next(err); }
  }
};

module.exports = AdminDirectorController;
