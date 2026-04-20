'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Voucher = sequelize.define('Voucher', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  promotion_id: {
    type: DataTypes.INTEGER,
    references: { model: 'promotions', key: 'id' },
  },
  max_uses: { type: DataTypes.INTEGER, defaultValue: 1 },
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'vouchers' });

module.exports = Voucher;
