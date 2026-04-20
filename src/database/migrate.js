'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');
require('../models'); // Load tất cả models và associations

async function migrate() {
  console.log('🔄 Đang tạo/đồng bộ database...');
  await sequelize.sync({ alter: process.env.DB_FORCE !== 'true' });
  console.log('✅ Database đã được đồng bộ thành công!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
