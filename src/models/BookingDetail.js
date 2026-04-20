'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Chi tiết vé trong Booking (1 booking có N vé)
const BookingTicket = sequelize.define('BookingTicket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  seat_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'seats', key: 'id' },
  },
  seat_price: { type: DataTypes.DECIMAL(12, 0), allowNull: false, comment: 'Giá ghế tại thời điểm đặt' },
}, { tableName: 'booking_tickets', timestamps: false });

// Chi tiết combo trong Booking (1 booking có N combo)
const BookingCombo = sequelize.define('BookingCombo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  combo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'combos', key: 'id' },
  },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(12, 0), allowNull: false, comment: 'Giá combo tại thời điểm đặt' },
}, { tableName: 'booking_combos', timestamps: false });

module.exports = { BookingTicket, BookingCombo };
