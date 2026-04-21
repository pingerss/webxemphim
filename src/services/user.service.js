'use strict';

const bcrypt = require('bcryptjs');
const { User, Booking, Showtime, Movie, MembershipTier } = require('../models');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

const UserService = {
  async getAll({ search, role, limit = 20, offset = 0 }) {
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
    return User.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
  },

  async updateProfile(userId, { full_name, phone, date_of_birth, gender }) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user.update({ full_name, phone, date_of_birth, gender });
  },


  async updateAvatar(userId, avatarUrl) {
    const user = await User.findByPk(userId);
    return user.update({ avatar_url: avatarUrl });
  },

  async changePassword(userId, { old_password, new_password }) {
    const user = await User.scope('withPassword').findByPk(userId);
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) throw new AppError('Mật khẩu cũ không đúng', 400);

    const newHash = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: newHash });
  },

  async getBookingHistory(userId, { limit, offset }) {
    return Booking.findAndCountAll({
      where: { user_id: userId },
      include: [{ model: Showtime, as: 'showtime', include: [{ model: Movie, as: 'movie', attributes: ['id', 'title', 'poster_url'] }] }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  },

  async getLoyaltyInfo(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: MembershipTier, as: 'membershipTier' }],
      attributes: ['id', 'full_name', 'loyalty_points', 'membership_tier_id'],
    });
    const allTiers = await MembershipTier.findAll({ order: [['min_points', 'ASC']] });
    return { user, tiers: allTiers };
  },

  async toggleActive(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user.update({ is_active: !user.is_active });
  },

  async changeRole(userId, role) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    if (!['admin', 'customer'].includes(role)) throw new AppError('Role không hợp lệ', 400);
    return user.update({ role });
  },
};

module.exports = UserService;
