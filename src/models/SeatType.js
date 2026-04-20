'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SeatType = sequelize.define('SeatType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, comment: 'VD: Thường, VIP, Couple' },
  color_code: { type: DataTypes.STRING(10), defaultValue: '#4CAF50', comment: 'Màu hiển thị sơ đồ ghế' },
  price_multiplier: { type: DataTypes.DECIMAL(4, 2), defaultValue: 1.00, comment: 'Hệ số nhân giá, VIP = 1.5x' },
}, { tableName: 'seat_types' });

module.exports = SeatType;
