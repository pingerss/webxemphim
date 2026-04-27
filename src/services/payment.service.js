'use strict';

const crypto = require('crypto');
const { Booking, Payment, BookingTicket } = require('../models');
const { getRedisClient } = require('../config/redis');
const { seatLockKey } = require('../utils/helpers.util');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Format thời gian sang YYYYMMDDHHmmss theo múi giờ Việt Nam (GMT+7)
 */
function formatVnTime(date) {
  const tz = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${tz.getUTCFullYear()}${pad(tz.getUTCMonth() + 1)}${pad(tz.getUTCDate())}${pad(tz.getUTCHours())}${pad(tz.getUTCMinutes())}${pad(tz.getUTCSeconds())}`;
}

/**
 * Làm sạch chuỗi OrderInfo để VNPay chấp nhận
 */
function sanitizeOrderInfo(str) {
  if (!str) return '';
  return str
    .replace(/[:()!@#$%^&*+=\[\]{}\|\\;'"<>?\/,`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sắp xếp và mã hóa URL chuẩn VNPay:
 * - Chuyển đổi mọi giá trị thành String
 * - encodeURIComponent cho giá trị
 * - Thay thế '%20' thành '+' để đồng bộ chữ ký
 */
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj)
    .filter(k => obj[k] !== '' && obj[k] !== null && obj[k] !== undefined)
    .sort();

  for (let key of keys) {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
  }
  return sorted;
}

const PaymentService = {
  async createVnpayUrl({ bookingCode, amount, orderInfo, ipAddr }) {
    const now = new Date();
    const createDate = formatVnTime(now);
    const expireDate = formatVnTime(new Date(now.getTime() + 15 * 60 * 1000));

    let params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNPAY_TMN_CODE,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: bookingCode,
      vnp_OrderInfo: sanitizeOrderInfo(orderInfo),
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // 1. Sắp xếp và Encode tham số
    params = sortObject(params);

    // 2. Tạo chuỗi dữ liệu (signData) dùng để băm và tạo query string
    const signData = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 3. Tính mã băm bằng HMAC-SHA512
    const secureHash = crypto
      .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    logger.info(`[VNPay] SignData: ${signData}`);
    logger.info(`[VNPay] SecureHash: ${secureHash}`);

    // 4. Trả về URL hoàn chỉnh có chứa chữ ký
    return `${process.env.VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;
  },

  /**
   * Xử lý VNPay Return (redirect từ trình duyệt)
   */
  async handleVnpayReturn(query) {
    const receivedHash = query.vnp_SecureHash;
    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;

    const signData = { ...query };
    delete signData.vnp_SecureHash;
    delete signData.vnp_SecureHashType;

    // Sắp xếp và encode lại các query params
    const sortedData = sortObject(signData);
    const signStr = Object.keys(sortedData)
      .map(key => `${key}=${sortedData[key]}`)
      .join('&');

    const computedHash = crypto
      .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
      .update(Buffer.from(signStr, 'utf-8'))
      .digest('hex');

    const isVerified = computedHash.toLowerCase() === receivedHash.toLowerCase();

    logger.info(`[VNPay Return] TxnRef=${vnp_TxnRef}, ResponseCode=${vnp_ResponseCode}, isVerified=${isVerified}`);

    const booking = await Booking.findOne({ where: { booking_code: vnp_TxnRef } });
    if (!booking) return { success: false, bookingCode: vnp_TxnRef };

    const success = isVerified && vnp_ResponseCode === '00';
    return { success, bookingCode: vnp_TxnRef, booking };
  },

  /**
   * Xử lý IPN (server-to-server từ VNPay)
   */
  async handleVnpayIpn(query) {
    const receivedHash = query.vnp_SecureHash;
    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const vnp_Amount = query.vnp_Amount;
    const vnp_TransactionNo = query.vnp_TransactionNo;

    const signData = { ...query };
    delete signData.vnp_SecureHash;
    delete signData.vnp_SecureHashType;

    // Sắp xếp và encode lại các query params
    const sortedData = sortObject(signData);
    const signStr = Object.keys(sortedData)
      .map(key => `${key}=${sortedData[key]}`)
      .join('&');

    const computedHash = crypto
      .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
      .update(Buffer.from(signStr, 'utf-8'))
      .digest('hex');

    if (computedHash.toLowerCase() !== receivedHash.toLowerCase()) {
      throw new AppError('Invalid VNPay signature', 400);
    }

    const booking = await Booking.findOne({
      where: { booking_code: vnp_TxnRef },
      include: [
        { model: Payment, as: 'payment' },
        { model: BookingTicket, as: 'tickets' },
      ],
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.payment?.status === 'success') {
      return { message: 'Already processed' };
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

    await Payment.upsert(paymentData);

    const redis = getRedisClient();

    if (isSuccess) {
      await booking.update({ status: 'paid', paid_at: new Date() });
      // Xóa Redis lock ghế: booking đã "paid" trong DB, không cần lock tạm nữa
      for (const ticket of booking.tickets || []) {
        await redis.del(seatLockKey(booking.showtime_id, ticket.seat_id));
      }
      logger.info(`[VNPay IPN] Đã nhả Redis lock ${booking.tickets?.length} ghế - booking ${vnp_TxnRef}`);
    } else {
      const BookingService = require('./booking.service');
      await BookingService.cancel(booking.id, booking.user_id);
    }

    return { success: isSuccess, bookingCode: vnp_TxnRef };
  },
};

module.exports = PaymentService;