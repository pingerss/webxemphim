'use strict';

const { Combo } = require('../models');
const AppError = require('../utils/AppError');

const ComboService = {
  async getAll() {
    return Combo.findAll({ where: { is_active: true }, order: [['price', 'ASC']] });
  },
  async getById(id) {
    return Combo.findByPk(id);
  },
  async create(payload) {
    return Combo.create(payload);
  },
  async update(id, payload) {
    const combo = await Combo.findByPk(id);
    if (!combo) throw new AppError('Không tìm thấy combo', 404);
    return combo.update(payload);
  },
  async remove(id) {
    const combo = await Combo.findByPk(id);
    if (!combo) throw new AppError('Không tìm thấy combo', 404);
    await combo.update({ is_active: false });
  },
};
module.exports = ComboService;
