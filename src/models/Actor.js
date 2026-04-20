'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Actor = sequelize.define('Actor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  bio: { type: DataTypes.TEXT },
  avatar_url: { type: DataTypes.STRING(500) },
  nationality: { type: DataTypes.STRING(100) },
  birth_date: { type: DataTypes.DATEONLY },
}, { tableName: 'actors' });

module.exports = Actor;
