'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Genre = sequelize.define('Genre', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), unique: true },
}, { tableName: 'genres' });

module.exports = Genre;
