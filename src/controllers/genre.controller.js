'use strict';

const GenreService = require('../services/genre.service');
const ApiResponse = require('../utils/apiResponse.util');

const GenreController = {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await GenreService.getAll()); }
    catch (err) { next(err); }
  },
  async getMoviesByGenre(req, res, next) {
    try { return ApiResponse.success(res, await GenreService.getMoviesByGenre(req.params.id, req.query)); }
    catch (err) { next(err); }
  },
};
module.exports = GenreController;
