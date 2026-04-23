'use strict';

const ActorService = require('../../services/actor.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

const AdminActorController = {
  async getAll(req, res, next) {
    try {
      const data = await ActorService.getAll();
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'actors');
        payload.avatar_url = r.secure_url;
      }
      const data = await ActorService.create(payload);
      return ApiResponse.created(res, data, 'Thêm diễn viên thành công');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, 'actors');
        payload.avatar_url = r.secure_url;
      }
      const data = await ActorService.update(req.params.id, payload);
      return ApiResponse.success(res, data, 'Cập nhật diễn viên thành công');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await ActorService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa diễn viên thành công');
    } catch (err) { next(err); }
  }
};

module.exports = AdminActorController;
