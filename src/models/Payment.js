'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  provider: {
    type: DataTypes.ENUM('vnpay', 'zalopay', 'momo', 'cash'),
    defaultValue: 'vnpay',
  },
  amount: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  transaction_id: { type: DataTypes.STRING(100), comment: 'Mã giao dịch từ cổng TT' },
  provider_response: { type: DataTypes.JSON, comment: 'Full response JSON từ VNPay' },
  paid_at: { type: DataTypes.DATE },
  refunded_at: { type: DataTypes.DATE },
  refund_amount: { type: DataTypes.DECIMAL(12, 0) },
}, { tableName: 'payments' });

module.exports = Payment;
