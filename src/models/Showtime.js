'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Showtime = sequelize.define('Showtime', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  movie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'movies', key: 'id' },
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'rooms', key: 'id' },
  },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false, comment: 'Tính tự động: start + duration + cleaning_time' },
  base_price: { type: DataTypes.DECIMAL(12, 0), allowNull: false, comment: 'Giá vé cơ bản (VND)' },
  cleaning_time_mins: { type: DataTypes.INTEGER, defaultValue: 15, comment: 'Thời gian dọn rạp giữa hai suất' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  subtitle_type: {
    type: DataTypes.ENUM('dubbed', 'subtitled', 'original'),
    defaultValue: 'subtitled',
  },
  format: {
    type: DataTypes.ENUM('2D', '3D', 'IMAX', '4DX'),
    defaultValue: '2D',
  },
}, {
  tableName: 'showtimes',
  indexes: [
    { fields: ['room_id', 'start_time'] },
    { fields: ['movie_id', 'start_time'] },
  ],
});

module.exports = Showtime;
