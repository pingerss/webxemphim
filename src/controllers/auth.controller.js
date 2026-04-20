'use strict';

const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse.util');

const AuthController = {
  async register(req, res, next) {
    try {
      const data = await AuthService.register(req.body);
      return ApiResponse.created(res, data, 'Đăng ký tài khoản thành công');
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const data = await AuthService.login(req.body);
      return ApiResponse.success(res, data, 'Đăng nhập thành công');
    } catch (err) { next(err); }
  },

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;
      const data = await AuthService.refreshToken(refresh_token);
      return ApiResponse.success(res, data, 'Làm mới token thành công');
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.user.id);
      return ApiResponse.success(res, null, 'Đăng xuất thành công');
    } catch (err) { next(err); }
  },

  async getMe(req, res) {
    return ApiResponse.success(res, req.user);
  },

  async forgotPassword(req, res, next) {
    try {
      await AuthService.forgotPassword(req.body.email);
      return ApiResponse.success(res, null, 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      await AuthService.resetPassword(req.body);
      return ApiResponse.success(res, null, 'Đặt lại mật khẩu thành công');
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;
