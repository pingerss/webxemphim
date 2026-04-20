'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MovieReview = sequelize.define('MovieReview', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  movie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'movies', key: 'id' },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  rating: { type: DataTypes.TINYINT, allowNull: false, comment: '1-10' },
  comment: { type: DataTypes.TEXT },
  is_visible: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'movie_reviews' });

module.exports = MovieReview;
