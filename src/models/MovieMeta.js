'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Bảng junction: Movie <-> Genre (N-N)
const MovieGenre = sequelize.define('MovieGenre', {
  movie_id: { type: DataTypes.INTEGER, primaryKey: true },
  genre_id: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'movie_genres', timestamps: false });

// Bảng junction: Movie <-> Actor (N-N) với role
const MovieActor = sequelize.define('MovieActor', {
  movie_id: { type: DataTypes.INTEGER, primaryKey: true },
  actor_id: { type: DataTypes.INTEGER, primaryKey: true },
  character_name: { type: DataTypes.STRING(150) },
  role_order: { type: DataTypes.INTEGER, defaultValue: 99 },
}, { tableName: 'movie_actors', timestamps: false });

module.exports = { MovieGenre, MovieActor };
