'use strict';

const crypto = require('crypto');
const { Booking, Payment } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const qs = require('querystring');

/**
 * Tạo chữ ký HMAC-SHA512 cho VNPay
 */
function createVnpaySignature(params, hashSecret) {
  const sortedParams = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] !== null && params[k] !== undefined)
    .sort()
    .reduce((acc, k) => { acc[k] = params[k]; return acc; }, {});

  const signData = qs.stringify(sortedParams, { encode: false });
  return crypto.createHmac('sha512', hashSecret).update(signData).digest('hex');
}

const PaymentService = {
  async createVnpayUrl({ bookingCode, amount, orderInfo, ipAddr }) {
    const date = new Date();
    const createDate = date.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000).toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNPAY_TMN_CODE,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: bookingCode,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'billpayment',
      vnp_Amount: amount * 100, // VNPay tính theo đơn vị x100
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const secureHash = createVnpaySignature(params, process.env.VNPAY_HASH_SECRET);
    params.vnp_SecureHash = secureHash;

    return `${process.env.VNPAY_URL}?${qs.stringify(params, { encode: false })}`;
  },

  /**
   * Xử lý VNPay Return (redirect từ trình duyệt)
   */
  async handleVnpayReturn(query) {
    const { vnp_SecureHash, vnp_TxnRef, vnp_ResponseCode, ...rest } = query;
    const expectedHash = createVnpaySignature(rest, process.env.VNPAY_HASH_SECRET);

    if (expectedHash !== vnp_SecureHash) {
      logger.warn('VNPay return: invalid signature');
      return { success: false, bookingCode: vnp_TxnRef };
    }

    const booking = await Booking.findOne({ where: { booking_code: vnp_TxnRef } });
    if (!booking) return { success: false, bookingCode: vnp_TxnRef };

    const success = vnp_ResponseCode === '00';
    return { success, bookingCode: vnp_TxnRef, booking };
  },

  /**
   * Xử lý IPN (server-to-server từ VNPay)
   * ĐÂY là nơi chính thức cập nhật trạng thái thanh toán vào DB
   */
  async handleVnpayIpn(query) {
    const { vnp_SecureHash, vnp_TxnRef, vnp_ResponseCode, vnp_Amount, vnp_TransactionNo, ...rest } = query;
    const expectedHash = createVnpaySignature(rest, process.env.VNPAY_HASH_SECRET);

    if (expectedHash !== vnp_SecureHash) throw new AppError('Invalid VNPay signature', 400);

    const booking = await Booking.findOne({
      where: { booking_code: vnp_TxnRef },
      include: [{ model: Payment, as: 'payment' }],
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.payment?.status === 'success') {
      return { message: 'Already processed' }; // Idempotent
    }

    const isSuccess = vnp_ResponseCode === '00';
    const paymentData = {
      booking_id: booking.id,
      provider: 'vnpay',
      amount: parseInt(vnp_Amount) / 100,
      status: isSuccess ? 'success' : 'failed',
      transaction_id: vnp_TransactionNo,
      provider_response: query,
      paid_at: isSuccess ? new Date() : null,
    };

    // Tạo hoặc cập nhật Payment record
    await Payment.upsert(paymentData);

    if (isSuccess) {
      await booking.update({ status: 'paid', paid_at: new Date() });
      // TODO: Gửi email xác nhận
      // TODO: Cộng điểm tích lũy
    } else {
      // Hủy booking, nhả ghế
      const BookingService = require('./booking.service');
      await BookingService.cancel(booking.id, booking.user_id);
    }

    return { success: isSuccess, bookingCode: vnp_TxnRef };
  },
};

module.exports = PaymentService;
