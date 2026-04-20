'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MembershipTier = sequelize.define('MembershipTier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  min_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  description: { type: DataTypes.TEXT },
}, { tableName: 'membership_tiers' });

module.exports = MembershipTier;
