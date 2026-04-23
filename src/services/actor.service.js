'use strict';

const { Actor, Movie } = require('../models');
const AppError = require('../utils/AppError');

const ActorService = {
  async getAll() {
    return Actor.findAll({ order: [['id', 'DESC']] });
  },
  
  async getById(id) {
    return Actor.findByPk(id, { 
      include: [{ model: Movie, as: 'movies' }] 
    });
  },

  async create(payload) {
    return Actor.create(payload);
  },

  async update(id, payload) {
    const actor = await Actor.findByPk(id);
    if (!actor) throw new AppError('Không tìm thấy diễn viên', 404);
    return actor.update(payload);
  },

  async remove(id) {
    const actor = await Actor.findByPk(id);
    if (!actor) throw new AppError('Không tìm thấy diễn viên', 404);
    await actor.destroy();
  }
};

module.exports = ActorService;
