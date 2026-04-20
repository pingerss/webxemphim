'use strict';

const UserService = require('../../services/user.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { parsePagination } = require('../../utils/helpers.util');

const AdminUserController = {
  async getAll(req, res, next) {
    try {
      const data = await UserService.getAll({ ...req.query, ...parsePagination(req.query) });
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  async toggleActive(req, res, next) {
    try {
      const data = await UserService.toggleActive(req.params.id);
      return ApiResponse.success(res, data, 'Cập nhật trạng thái thành công');
    } catch (err) { next(err); }
  },
  async changeRole(req, res, next) {
    try {
      const data = await UserService.changeRole(req.params.id, req.body.role);
      return ApiResponse.success(res, data, 'Đổi quyền thành công');
    } catch (err) { next(err); }
  },
};
module.exports = AdminUserController;
