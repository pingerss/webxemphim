'use strict';

const { Director, Movie } = require('../models');
const AppError = require('../utils/AppError');

const DirectorService = {
  async getAll() {
    return Director.findAll({ order: [['id', 'DESC']] });
  },
  
  async getById(id) {
    return Director.findByPk(id, { 
      include: [{ model: Movie, as: 'movies' }] 
    });
  },

  async create(payload) {
    return Director.create(payload);
  },

  async update(id, payload) {
    const director = await Director.findByPk(id);
    if (!director) throw new AppError('Không tìm thấy đạo diễn', 404);
    return director.update(payload);
  },

  async remove(id) {
    const director = await Director.findByPk(id);
    if (!director) throw new AppError('Không tìm thấy đạo diễn', 404);
    await director.destroy();
  }
};

module.exports = DirectorService;
