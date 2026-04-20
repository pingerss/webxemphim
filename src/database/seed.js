'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { MembershipTier, User, Genre, SeatType, Cinema, Room } = require('../models');

async function seed() {
  // Không sync() ở đây - tables đã được tạo bởi `npm run migrate`
  // sync({ alter: true }) sẽ lỗi với TiDB khi cột UNIQUE đã tồn tại
  console.log('🌱 Seeding dữ liệu mẫu...');

  // Membership Tiers
  await MembershipTier.bulkCreate([
    { name: 'Bạch Kim', min_points: 0, discount_percent: 0, description: 'Hạng mặc định' },
    { name: 'Vàng', min_points: 500, discount_percent: 5, description: 'Giảm 5% mọi đơn hàng' },
    { name: 'Kim Cương', min_points: 2000, discount_percent: 10, description: 'Giảm 10% + ưu tiên ghế' },
  ], { ignoreDuplicates: true });

  // Admin user
  const adminHash = await bcrypt.hash('Admin@123', 12);
  await User.findOrCreate({
    where: { email: 'admin@cinestar.vn' },
    defaults: { full_name: 'Super Admin', email: 'admin@cinestar.vn', password_hash: adminHash, role: 'admin', membership_tier_id: 1 },
  });

  // Genres
  await Genre.bulkCreate([
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Khoa Học Viễn Tưởng', slug: 'khoa-hoc-vien-tuong' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
  ], { ignoreDuplicates: true });

  // Seat Types
  await SeatType.bulkCreate([
    { name: 'Thường', color_code: '#4CAF50', price_multiplier: 1.00 },
    { name: 'VIP', color_code: '#FFD700', price_multiplier: 1.50 },
    { name: 'Couple', color_code: '#E91E63', price_multiplier: 2.00 },
  ], { ignoreDuplicates: true });

  // Sample Cinema
  const [cinema] = await Cinema.findOrCreate({
    where: { name: 'CineStar Quận 1' },
    defaults: {
      name: 'CineStar Quận 1',
      address: '135 Hai Bà Trưng, Bến Nghé, Quận 1',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
      phone: '028 3822 5000',
    },
  });

  // Sample Room
  await Room.findOrCreate({
    where: { cinema_id: cinema.id, name: 'Phòng 1' },
    defaults: {
      cinema_id: cinema.id,
      name: 'Phòng 1 - Standard',
      room_type: 'standard',
      total_rows: 8,
      total_cols: 12,
    },
  });

  console.log('✅ Seed dữ liệu hoàn thành!');
  console.log('👤 Admin: admin@cinestar.vn / Admin@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
