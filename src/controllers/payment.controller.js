'use strict';

const PaymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse.util');
const logger = require('../config/logger');

const PaymentController = {
  /**
   * GET /payments/vnpay/return
   * VNPay redirect sau khi user thanh toán (hiển thị kết quả).
   */
  async vnpayReturn(req, res, next) {
    try {
      const result = await PaymentService.handleVnpayReturn(req.query);
      // Redirect về frontend với kết quả
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const status = result.success ? 'success' : 'failed';
      return res.redirect(`${frontendUrl}/booking/result?status=${status}&booking_code=${result.bookingCode}`);
    } catch (err) { next(err); }
  },

  /**
   * POST /payments/vnpay/ipn
   * VNPay IPN webhook - xác nhận thanh toán server-to-server.
   * QUAN TRỌNG: Phải verify chữ ký trước khi cập nhật DB.
   */
  async vnpayIpn(req, res, next) {
    try {
      const result = await PaymentService.handleVnpayIpn(req.query);
      logger.info(`VNPay IPN: ${JSON.stringify(result)}`);
      // VNPay yêu cầu response đúng format
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (err) {
      logger.error('VNPay IPN error:', err);
      return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  },
};

module.exports = PaymentController;
