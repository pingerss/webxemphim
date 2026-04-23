'use strict';

const MovieService = require('../../services/movie.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');
const { parsePagination } = require('../../utils/helpers.util');

const AdminMovieController = {
  async getAll(req, res, next) {
    try {
      const data = await MovieService.getAll({ ...req.query, ...parsePagination(req.query) });
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await MovieService.getById(req.params.id);
      if (!data) return ApiResponse.notFound(res);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const payload = { ...req.body };
      
      // Parse genre_ids if it's from form-data (stringified array)
      if (typeof payload.genre_ids === 'string') {
        try {
          payload.genre_ids = JSON.parse(payload.genre_ids);
        } catch (e) {}
      }

      if (req.files?.poster?.[0]) {
        const r = await uploadToCloudinary(req.files.poster[0].buffer, 'movies/posters');
        payload.poster_url = r.secure_url;
      }
      if (req.files?.backdrop?.[0]) {
        const r = await uploadToCloudinary(req.files.backdrop[0].buffer, 'movies/backdrops');
        payload.backdrop_url = r.secure_url;
      }
      const movie = await MovieService.create(payload);
      return ApiResponse.created(res, movie, 'Thêm phim thành công');
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const payload = { ...req.body };
      
      // Parse genre_ids if it's from form-data (stringified array)
      if (typeof payload.genre_ids === 'string') {
        try {
          payload.genre_ids = JSON.parse(payload.genre_ids);
        } catch (e) {}
      }

      if (req.files?.poster?.[0]) {
        const r = await uploadToCloudinary(req.files.poster[0].buffer, 'movies/posters');
        payload.poster_url = r.secure_url;
      }
      if (req.files?.backdrop?.[0]) {
        const r = await uploadToCloudinary(req.files.backdrop[0].buffer, 'movies/backdrops');
        payload.backdrop_url = r.secure_url;
      }
      const movie = await MovieService.update(req.params.id, payload);
      return ApiResponse.success(res, movie, 'Cập nhật phim thành công');
    } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await MovieService.remove(req.params.id);
      return ApiResponse.success(res, null, 'Xóa phim thành công');
    } catch (err) { next(err); }
  },
};
module.exports = AdminMovieController;
