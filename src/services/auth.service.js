'use strict';

const bcrypt = require('bcryptjs');
const { User, MembershipTier } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');
const AppError = require('../utils/AppError');
const transporter = require('../config/mailer');
const crypto = require('crypto');

const AuthService = {
  async register({ full_name, email, password, phone, date_of_birth, gender }) {
    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) throw new AppError('Email đã được sử dụng', 409);

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      full_name,
      email,
      password_hash,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    await user.update({ refresh_token: refreshToken });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },


  async login({ email, password }) {
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);
    if (!user.is_active) throw new AppError('Tài khoản đã bị khóa', 403);
    if (!user.password_hash) throw new AppError('Tài khoản đăng nhập qua mạng xã hội, vui lòng dùng Google', 400);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new AppError('Email hoặc mật khẩu không đúng', 401);

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    await user.update({ refresh_token: refreshToken });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  async refreshToken(token) {
    if (!token) throw new AppError('Refresh token không được để trống', 400);
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
    }

    const user = await User.scope('withPassword').findByPk(decoded.id);
    if (!user || user.refresh_token !== token) {
      throw new AppError('Refresh token không hợp lệ', 401);
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });
    await user.update({ refresh_token: newRefreshToken });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId) {
    await User.update({ refresh_token: null }, { where: { id: userId } });
  },

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Không lộ thông tin email có tồn tại hay không

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    // TODO: Lưu token vào DB hoặc Redis với TTL
    // await user.update({ reset_token: resetToken, reset_token_expires: resetExpires });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Đặt lại mật khẩu CineStar',
      html: `<p>Nhấn vào link sau để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a>. Link hết hạn sau 30 phút.</p>`,
    });
  },

  async resetPassword({ token, newPassword }) {
    // TODO: Tìm user theo reset_token và kiểm tra hạn
    // const user = await User.findOne({ where: { reset_token: token, reset_token_expires: { [Op.gt]: new Date() } } });
    // if (!user) throw new AppError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
    // const password_hash = await bcrypt.hash(newPassword, 12);
    // await user.update({ password_hash, reset_token: null, reset_token_expires: null });
    throw new AppError('Tính năng đang được phát triển', 501);
  },
};

function sanitizeUser(user) {
  const { password_hash, refresh_token, ...safe } = user.toJSON();
  return safe;
}

module.exports = AuthService;
