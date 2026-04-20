'use strict';

const { Sequelize } = require('sequelize');

// TiDB Cloud yêu cầu SSL, local MySQL thì không cần
const isTiDB = (process.env.DB_HOST || '').includes('tidbcloud.com');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    timezone: '+07:00',
    // SSL bắt buộc cho TiDB Cloud
    ...(isTiDB && {
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
        },
      },
    }),
  }
);

async function connectDB() {
  await sequelize.authenticate();
}

module.exports = { sequelize, connectDB };
