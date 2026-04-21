'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: true }, // null nếu đăng nhập OAuth
  phone: { type: DataTypes.STRING(20), allowNull: true },
  date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },          // VD: '2000-05-15'
  gender: {                                                               // Nam / Nữ / Khác
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  avatar_url: { type: DataTypes.STRING(500) },
  role: {
    type: DataTypes.ENUM('admin', 'customer'),
    defaultValue: 'customer',
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  membership_tier_id: {
    type: DataTypes.INTEGER,
    references: { model: 'membership_tiers', key: 'id' },
  },
  google_id: { type: DataTypes.STRING(255), unique: true, allowNull: true },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  refresh_token: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password_hash', 'refresh_token'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
});

module.exports = User;
