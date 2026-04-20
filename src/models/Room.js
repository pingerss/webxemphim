'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cinema_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cinemas', key: 'id' },
  },
  name: { type: DataTypes.STRING(50), allowNull: false, comment: 'VD: Phòng 1, IMAX 1' },
  room_type: {
    type: DataTypes.ENUM('standard', 'imax', '4dx', 'vip'),
    defaultValue: 'standard',
  },
  total_rows: { type: DataTypes.INTEGER, allowNull: false },
  total_cols: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'rooms' });

module.exports = Room;
