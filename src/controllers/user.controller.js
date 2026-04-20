'use strict';

const UserService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse.util');
const { uploadToCloudinary } = require('../middlewares/upload.middleware');
const { parsePagination } = require('../utils/helpers.util');

const UserController = {
  async getProfile(req, res) {
    return ApiResponse.success(res, req.user);
  },
  async updateProfile(req, res, next) {
    try {
      const data = await UserService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, data, 'Cập nhật thông tin thành công');
    } catch (err) { next(err); }
  },
  async updateAvatar(req, res, next) {
    try {
      if (!req.file) return ApiResponse.error(res, 'Không có file ảnh', 400);
      const result = await uploadToCloudinary(req.file.buffer, 'avatars');
      const data = await UserService.updateAvatar(req.user.id, result.secure_url);
      return ApiResponse.success(res, data, 'Cập nhật ảnh đại diện thành công');
    } catch (err) { next(err); }
  },
  async changePassword(req, res, next) {
    try {
      await UserService.changePassword(req.user.id, req.body);
      return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');
    } catch (err) { next(err); }
  },
  async getBookingHistory(req, res, next) {
    try {
      const data = await UserService.getBookingHistory(req.user.id, parsePagination(req.query));
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  async getLoyaltyInfo(req, res, next) {
    try {
      const data = await UserService.getLoyaltyInfo(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
};
module.exports = UserController;
