'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  discount_type: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false,
    comment: 'Giảm theo % hoặc số tiền cố định',
  },
  discount_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  min_order_amount: { type: DataTypes.DECIMAL(12, 0), defaultValue: 0 },
  max_discount_amount: { type: DataTypes.DECIMAL(12, 0), comment: 'Giới hạn tối đa khi giảm theo %' },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  banner_url: { type: DataTypes.STRING(500) },
}, { tableName: 'promotions' });

module.exports = Promotion;
