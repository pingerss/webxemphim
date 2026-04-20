'use strict';

const BookingService = require('../services/booking.service');
const ApiResponse = require('../utils/apiResponse.util');
const { parsePagination } = require('../utils/helpers.util');

const BookingController = {
  /**
   * POST /bookings/hold
   * Body: { showtime_id, seat_ids: [1,2,3], combo_items: [{combo_id, quantity}] }
   * Giữ ghế 5 phút bằng Redis
   */
  async holdSeats(req, res, next) {
    try {
      const booking = await BookingService.holdSeats(req.user.id, req.body);
      return ApiResponse.created(res, booking, 'Giữ ghế thành công. Vui lòng thanh toán trong 5 phút.');
    } catch (err) { next(err); }
  },

  /**
   * POST /bookings/checkout
   * Body: { booking_id, voucher_code? }
   * Tạo URL VNPay, gia hạn giữ ghế 15'
   */
  async checkout(req, res, next) {
    try {
      const result = await BookingService.checkout(req.user.id, req.body);
      return ApiResponse.success(res, result, 'Tạo link thanh toán thành công');
    } catch (err) { next(err); }
  },

  async getMyBookings(req, res, next) {
    try {
      const data = await BookingService.getUserBookings(req.user.id, parsePagination(req.query));
      return ApiResponse.success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const booking = await BookingService.getById(req.params.id, req.user.id);
      if (!booking) return ApiResponse.notFound(res);
      return ApiResponse.success(res, booking);
    } catch (err) { next(err); }
  },

  async cancel(req, res, next) {
    try {
      await BookingService.cancel(req.params.id, req.user.id);
      return ApiResponse.success(res, null, 'Hủy đơn thành công');
    } catch (err) { next(err); }
  },
};

module.exports = BookingController;
