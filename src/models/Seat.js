'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Seat = sequelize.define('Seat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'rooms', key: 'id' },
  },
  seat_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'seat_types', key: 'id' },
  },
  row_label: { type: DataTypes.STRING(5), allowNull: false, comment: 'Hàng: A, B, C...' },
  col_number: { type: DataTypes.INTEGER, allowNull: false, comment: 'Cột: 1, 2, 3...' },
  seat_name: { type: DataTypes.STRING(10), allowNull: false, comment: 'VD: A1, B5' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'seats',
  indexes: [{ unique: true, fields: ['room_id', 'row_label', 'col_number'] }],
});

module.exports = Seat;
