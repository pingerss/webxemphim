'use strict';

const { sequelize } = require('../../config/database');
const { Booking, Payment, Movie, User } = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/apiResponse.util');

const AdminDashboardController = {
  async getStats(req, res, next) {
    try {
      const [totalUsers, totalMovies, totalBookings, totalRevenue] = await Promise.all([
        User.count({ where: { role: 'customer' } }),
        Movie.count(),
        Booking.count({ where: { status: 'paid' } }),
        Payment.sum('amount', { where: { status: 'success' } }),
      ]);

      return ApiResponse.success(res, {
        totalUsers,
        totalMovies,
        totalBookings,
        totalRevenue: totalRevenue || 0,
      });
    } catch (err) { next(err); }
  },

  async getRevenue(req, res, next) {
    try {
      const { from, to } = req.query;
      const where = { status: 'success' };
      if (from && to) {
        where.paid_at = { [Op.between]: [new Date(from), new Date(to)] };
      }

      const data = await Payment.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('paid_at')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
        ],
        group: [sequelize.fn('DATE', sequelize.col('paid_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('paid_at')), 'ASC']],
      });

      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },
};
module.exports = AdminDashboardController;
