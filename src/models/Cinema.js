'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cinema = sequelize.define('Cinema', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  district: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(150) },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  image_url: { type: DataTypes.STRING(500) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'cinemas' });

module.exports = Cinema;
