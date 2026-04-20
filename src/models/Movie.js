'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Movie = sequelize.define('Movie', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  original_title: { type: DataTypes.STRING(255) },
  slug: { type: DataTypes.STRING(300), unique: true },
  description: { type: DataTypes.TEXT },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Thời lượng tính bằng phút' },
  release_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
  language: { type: DataTypes.STRING(50), defaultValue: 'Tiếng Việt' },
  country: { type: DataTypes.STRING(100) },
  age_rating: {
    type: DataTypes.ENUM('P', 'C13', 'C16', 'C18'),
    defaultValue: 'P',
    comment: 'P=Mọi lứa tuổi, C13/C16/C18=Giới hạn tuổi',
  },
  status: {
    type: DataTypes.ENUM('coming_soon', 'now_showing', 'ended'),
    defaultValue: 'coming_soon',
  },
  poster_url: { type: DataTypes.STRING(500) },
  backdrop_url: { type: DataTypes.STRING(500) },
  trailer_url: { type: DataTypes.STRING(500) },
  director_id: {
    type: DataTypes.INTEGER,
    references: { model: 'directors', key: 'id' },
  },
  avg_rating: { type: DataTypes.DECIMAL(3, 1), defaultValue: 0 },
  total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'movies' });

module.exports = Movie;
