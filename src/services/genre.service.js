'use strict';

const { Genre, Movie } = require('../models');

const GenreService = {
  async getAll() {
    return Genre.findAll({ order: [['name', 'ASC']] });
  },
  async getMoviesByGenre(genreId, { limit = 10, offset = 0 }) {
    const genre = await Genre.findByPk(genreId, {
      include: [{ model: Movie, as: 'movies', where: { status: 'now_showing' }, through: { attributes: [] }, limit, offset }],
    });
    return genre;
  },
};
module.exports = GenreService;
