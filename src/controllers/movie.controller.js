'use strict';

const MovieService = require('../services/movie.service');
const ApiResponse = require('../utils/apiResponse.util');
const { parsePagination } = require('../utils/helpers.util');

const MovieController = {
  async getAll(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const data = await MovieService.getAll({ ...req.query, ...pagination });
      return ApiResponse.paginated(res, data.rows, { total: data.count, ...pagination });
    } catch (err) { next(err); }
  },

  async getNowShowing(req, res, next) {
    try {
      const data = await MovieService.getByStatus('now_showing', parsePagination(req.query));
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async getComingSoon(req, res, next) {
    try {
      const data = await MovieService.getByStatus('coming_soon', parsePagination(req.query));
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const movie = await MovieService.getById(req.params.id);
      if (!movie) return ApiResponse.notFound(res, 'Không tìm thấy phim');
      return ApiResponse.success(res, movie);
    } catch (err) { next(err); }
  },

  async getShowtimes(req, res, next) {
    try {
      const data = await MovieService.getShowtimes(req.params.id, req.query);
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },


  async getReviews(req, res, next) {
    try {
      const data = await MovieService.getReviews(req.params.id, parsePagination(req.query));
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async addReview(req, res, next) {
    try {
      const review = await MovieService.addReview(req.params.id, req.user.id, req.body);
      return ApiResponse.created(res, review, 'Đánh giá thành công');
    } catch (err) { next(err); }
  },
};

module.exports = MovieController;
