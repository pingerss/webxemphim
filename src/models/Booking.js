'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  showtime_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'showtimes', key: 'id' },
  },
  voucher_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'vouchers', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'expired'),
    defaultValue: 'pending',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 0), allowNull: false, comment: 'Giá vé + combo trước giảm giá' },
  discount_amount: { type: DataTypes.DECIMAL(12, 0), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
  points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  hold_expires_at: { type: DataTypes.DATE, comment: 'Thời hạn giữ ghế (5 hoặc 15 phút)' },
  paid_at: { type: DataTypes.DATE },
  cancelled_at: { type: DataTypes.DATE },
  cancellation_reason: { type: DataTypes.STRING(255) },
}, {
  tableName: 'bookings',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['booking_code'] },
    { fields: ['status', 'hold_expires_at'] },
  ],
});

module.exports = Booking;
