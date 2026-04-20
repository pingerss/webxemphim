'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Combo = sequelize.define('Combo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
  image_url: { type: DataTypes.STRING(500) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'combos' });

module.exports = Combo;
