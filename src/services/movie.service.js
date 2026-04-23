'use strict';

const { Op } = require('sequelize');
const { Movie, Director, Genre, Actor, Showtime, MovieReview, User, Cinema, Room } = require('../models');
const AppError = require('../utils/AppError');

const MovieService = {
  async getAll({ status, genre_id, search, page = 1, limit = 10, offset = 0 }) {
    const where = {};
    if (status) where.status = status;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const include = [
      { model: Director, as: 'director', attributes: ['id', 'name'] },
      { model: Genre, as: 'genres', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
    ];
    if (genre_id) {
      include.find(i => i.as === 'genres').where = { id: genre_id };
      include.find(i => i.as === 'genres').required = true;
    }

    return Movie.findAndCountAll({ where, include, limit, offset, distinct: true, order: [['created_at', 'DESC']] });
  },

  async getByStatus(status, { limit, offset }) {
    return Movie.findAll({
      where: { status },
      include: [
        { model: Director, as: 'director', attributes: ['id', 'name'] },
        { model: Genre, as: 'genres', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
      limit,
      offset,
      order: [['release_date', 'DESC']],
    });
  },

  async getById(id) {
    return Movie.findByPk(id, {
      include: [
        { model: Director, as: 'director' },
        { model: Genre, as: 'genres', through: { attributes: [] } },
        { model: Actor, as: 'actors', through: { attributes: ['character_name', 'role_order'] } },
      ],
    });
  },

  // Lấy lịch chiếu của phim, có thể filter theo ngày
  async getShowtimes(movieId, { date }) {
    const where = { movie_id: movieId, is_active: true };
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.start_time = { [Op.gte]: d, [Op.lt]: nextDay };
    }
    return Showtime.findAll({
      where,
      include: [
        { model: Room, as: 'room', attributes: ['id', 'name', 'room_type'] },
      ],
      order: [['start_time', 'ASC']],
    });
  },


  async getReviews(movieId, { limit, offset }) {
    return MovieReview.findAndCountAll({
      where: { movie_id: movieId, is_visible: true },
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url'] }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  },

  async addReview(movieId, userId, { rating, comment }) {
    const existing = await MovieReview.findOne({ where: { movie_id: movieId, user_id: userId } });
    if (existing) throw new AppError('Bạn đã đánh giá phim này rồi', 409);

    const review = await MovieReview.create({ movie_id: movieId, user_id: userId, rating, comment });

    // Cập nhật avg_rating
    const stats = await MovieReview.findOne({
      where: { movie_id: movieId, is_visible: true },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      raw: true,
    });
    await Movie.update(
      { avg_rating: parseFloat(stats.avg).toFixed(1), total_reviews: stats.count },
      { where: { id: movieId } }
    );

    return review;
  },

  async create(payload) {
    const { genre_ids, ...movieData } = payload;
    const movie = await Movie.create(movieData);
    
    if (genre_ids && Array.isArray(genre_ids) && genre_ids.length > 0) {
      await movie.setGenres(genre_ids);
    }
    
    return movie;
  },

  async update(id, payload) {
    const movie = await Movie.findByPk(id);
    if (!movie) throw new AppError('Không tìm thấy phim', 404);
    
    const { genre_ids, ...movieData } = payload;
    await movie.update(movieData);
    
    if (genre_ids && Array.isArray(genre_ids)) {
      await movie.setGenres(genre_ids);
    }
    
    return movie;
  },

  async remove(id) {
    const movie = await Movie.findByPk(id);
    if (!movie) throw new AppError('Không tìm thấy phim', 404);
    await movie.destroy();
  },
};

module.exports = MovieService;
