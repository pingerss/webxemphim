'use strict';

const { Op } = require('sequelize');
const { Promotion, Voucher } = require('../models');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

const PromotionService = {
  async getAll() {
    return Promotion.findAll({ order: [['created_at', 'DESC']] });
  },

  async getActive() {
    return Promotion.findAll({
      where: { is_active: true, start_date: { [Op.lte]: new Date() }, end_date: { [Op.gte]: new Date() } },
      order: [['created_at', 'DESC']],
    });
  },

  async create(payload) {
    return Promotion.create(payload);
  },

  async update(id, payload) {
    const promo = await Promotion.findByPk(id);
    if (!promo) throw new AppError('Không tìm thấy khuyến mãi', 404);
    return promo.update(payload);
  },

  async remove(id) {
    const promo = await Promotion.findByPk(id);
    if (!promo) throw new AppError('Không tìm thấy khuyến mãi', 404);
    await promo.update({ is_active: false });
  },

  /**
   * Validate voucher code và trả về số tiền được giảm
   */
  async validateVoucher(code, orderAmount) {
    const voucher = await Voucher.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        expires_at: { [Op.gte]: new Date() },
      },
      include: [{ model: Promotion, as: 'promotion' }],
    });

    if (!voucher) throw new AppError('Mã voucher không hợp lệ hoặc đã hết hạn', 400);
    if (voucher.used_count >= voucher.max_uses) throw new AppError('Mã voucher đã được sử dụng hết', 400);

    const promo = voucher.promotion;
    if (!promo.is_active) throw new AppError('Chương trình khuyến mãi đã kết thúc', 400);
    if (orderAmount < promo.min_order_amount) {
      throw new AppError(`Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString('vi-VN')} VND để dùng voucher này`, 400);
    }

    let discountAmount = 0;
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round((orderAmount * promo.discount_value) / 100);
      if (promo.max_discount_amount) {
        discountAmount = Math.min(discountAmount, promo.max_discount_amount);
      }
    } else {
      discountAmount = promo.discount_value;
    }

    return { voucher, promotion: promo, discountAmount, finalAmount: orderAmount - discountAmount };
  },

  /**
   * Tạo hàng loạt voucher từ promotion
   */
  async generateVouchers(promotionId, { count = 10, prefix = '', expires_at }) {
    const promo = await Promotion.findByPk(promotionId);
    if (!promo) throw new AppError('Không tìm thấy khuyến mãi', 404);

    const vouchers = Array.from({ length: count }, () => ({
      promotion_id: promotionId,
      code: (prefix + uuidv4().replace(/-/g, '').substring(0, 8)).toUpperCase(),
      max_uses: 1,
      expires_at: expires_at || promo.end_date,
    }));

    return Voucher.bulkCreate(vouchers);
  },
};

module.exports = PromotionService;
