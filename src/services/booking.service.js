'use strict';

const { sequelize } = require('../config/database');
const { Booking, BookingTicket, BookingCombo, Seat, SeatType, Showtime, Movie, Room, Cinema, Combo, Voucher, Promotion } = require('../models');
const { getRedisClient } = require('../config/redis');
const { generateBookingCode, seatLockKey, bookingHoldKey } = require('../utils/helpers.util');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

const HOLD_TTL = parseInt(process.env.SEAT_HOLD_TTL_SECONDS) || 300;       // 5 phút
const CHECKOUT_TTL = parseInt(process.env.SEAT_CHECKOUT_TTL_SECONDS) || 900; // 15 phút

const BookingService = {
  /**
   * BƯỚC 1: Giữ ghế 5 phút
   * - Dùng Redis SET NX để đảm bảo chỉ 1 request giữ được ghế (atomic)
   * - Dùng DB Transaction để tạo Booking + BookingTicket nguyên tử
   */
  async holdSeats(userId, { showtime_id, seat_ids, combo_items = [] }) {
    if (!seat_ids || seat_ids.length === 0) throw new AppError('Chưa chọn ghế', 400);

    const redis = getRedisClient();
    const heldKeys = [];

    // Transaction đảm bảo atomicity
    const booking = await sequelize.transaction(async (t) => {
      // 1. Lock Redis trước (NX = chỉ set nếu chưa tồn tại, ngăn race condition)
      for (const seatId of seat_ids) {
        const key = seatLockKey(showtime_id, seatId);
        const locked = await redis.set(key, userId, 'EX', HOLD_TTL, 'NX');
        if (!locked) {
          // Rollback: nhả các ghế đã lock trước đó
          for (const k of heldKeys) await redis.del(k);
          throw new AppError(`Ghế đã được người khác giữ. Vui lòng chọn ghế khác.`, 409);
        }
        heldKeys.push(key);
      }

      // 2. SELECT FOR UPDATE để khóa DB row (double-check)
      const seats = await Seat.findAll({
        where: { id: { [Op.in]: seat_ids }, room_id: sequelize.literal(`(SELECT room_id FROM showtimes WHERE id = ${showtime_id})`) },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (seats.length !== seat_ids.length) throw new AppError('Một số ghế không hợp lệ', 400);

      // 3. Tính giá
      const showtime = await Showtime.findByPk(showtime_id, { transaction: t });
      if (!showtime || !showtime.is_active) throw new AppError('Suất chiếu không tồn tại hoặc đã đóng', 400);

      let subtotal = 0;
      const ticketData = seats.map(seat => {
        const seatPrice = Math.round(showtime.base_price * (seat.price_multiplier || 1));
        subtotal += seatPrice;
        return { seat_id: seat.id, seat_price: seatPrice };
      });

      for (const item of combo_items) {
        const combo = await Combo.findByPk(item.combo_id, { transaction: t });
        if (!combo || !combo.is_active) throw new AppError(`Combo không tồn tại: ${item.combo_id}`, 400);
        subtotal += combo.price * item.quantity;
      }

      // 4. Tạo Booking
      const bookingCode = generateBookingCode();
      const holdExpiresAt = new Date(Date.now() + HOLD_TTL * 1000);

      const newBooking = await Booking.create({
        booking_code: bookingCode,
        user_id: userId,
        showtime_id,
        status: 'pending',
        subtotal,
        total_amount: subtotal,
        hold_expires_at: holdExpiresAt,
      }, { transaction: t });

      // 5. Tạo BookingTickets
      await BookingTicket.bulkCreate(
        ticketData.map(td => ({ ...td, booking_id: newBooking.id })),
        { transaction: t }
      );

      // 6. Tạo BookingCombos nếu có
      if (combo_items.length > 0) {
        const comboData = await Promise.all(combo_items.map(async item => {
          const combo = await Combo.findByPk(item.combo_id);
          return { booking_id: newBooking.id, combo_id: item.combo_id, quantity: item.quantity, unit_price: combo.price };
        }));
        await BookingCombo.bulkCreate(comboData, { transaction: t });
      }

      return newBooking;
    });

    return booking;
  },

  /**
   * BƯỚC 2: Checkout - Tạo URL VNPay, gia hạn giữ ghế lên 15'
   */
  async checkout(userId, { booking_id, voucher_code }) {
    const booking = await Booking.findOne({
      where: { id: booking_id, user_id: userId, status: 'pending' },
      include: [
        { model: BookingTicket, as: 'tickets' },
        { model: Showtime, as: 'showtime', include: [{ model: Movie, as: 'movie' }] },
      ],
    });
    if (!booking) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (booking.hold_expires_at < new Date()) throw new AppError('Giữ ghế đã hết hạn. Vui lòng đặt lại.', 410);

    let totalAmount = booking.subtotal;
    let discountAmount = 0;
    let voucherId = null;

    // Áp voucher nếu có
    if (voucher_code) {
      const voucherResult = await require('./promotion.service').validateVoucher(voucher_code, totalAmount);
      discountAmount = voucherResult.discountAmount;
      voucherId = voucherResult.voucher.id;
      totalAmount = Math.max(0, totalAmount - discountAmount);
    }

    // Gia hạn giữ ghế lên 15 phút
    const redis = getRedisClient();
    for (const ticket of booking.tickets) {
      const key = seatLockKey(booking.showtime_id, ticket.seat_id);
      await redis.expire(key, CHECKOUT_TTL);
    }

    const checkoutExpires = new Date(Date.now() + CHECKOUT_TTL * 1000);
    await booking.update({
      discount_amount: discountAmount,
      total_amount: totalAmount,
      voucher_id: voucherId,
      hold_expires_at: checkoutExpires,
    });

    // Tạo URL thanh toán VNPay
    const PaymentService = require('./payment.service');
    const paymentUrl = await PaymentService.createVnpayUrl({
      bookingCode: booking.booking_code,
      amount: totalAmount,
      orderInfo: `Dat ve phim ${booking.showtime.movie.title}`,
      ipAddr: '127.0.0.1', // TODO: Lấy từ request
    });

    return { booking, paymentUrl };
  },

  async getUserBookings(userId, { limit, offset }) {
    return Booking.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Showtime, as: 'showtime', include: [{ model: Movie, as: 'movie', attributes: ['id', 'title', 'poster_url'] }] },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  },

  async getById(id, userId) {
    return Booking.findOne({
      where: { id, user_id: userId },
      include: [
        { model: BookingTicket, as: 'tickets', include: [{ model: Seat, as: 'seat', include: [{ model: SeatType, as: 'seatType' }] }] },
        { model: BookingCombo, as: 'combos', include: [{ model: Combo, as: 'combo' }] },
        { model: Showtime, as: 'showtime', include: [{ model: Movie, as: 'movie' }, { model: Room, as: 'room', include: [{ model: Cinema, as: 'cinema' }] }] },
      ],
    });
  },

  async cancel(id, userId) {
    const booking = await Booking.findOne({ where: { id, user_id: userId }, include: [{ model: BookingTicket, as: 'tickets' }] });
    if (!booking) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (booking.status === 'paid') throw new AppError('Không thể hủy đơn đã thanh toán', 400);

    await booking.update({ status: 'cancelled', cancelled_at: new Date() });

    // Nhả ghế Redis
    const redis = getRedisClient();
    for (const ticket of booking.tickets) {
      await redis.del(seatLockKey(booking.showtime_id, ticket.seat_id));
    }
  },

  /**
   * Được gọi bởi BullMQ Worker khi đơn pending quá hạn
   */
  async expireOverdueBookings() {
    const expired = await Booking.findAll({
      where: { status: 'pending', hold_expires_at: { [Op.lt]: new Date() } },
      include: [{ model: BookingTicket, as: 'tickets' }],
    });

    const redis = getRedisClient();
    for (const booking of expired) {
      await booking.update({ status: 'expired' });
      for (const ticket of booking.tickets) {
        await redis.del(seatLockKey(booking.showtime_id, ticket.seat_id));
      }
    }

    return expired.length;
  },
};

module.exports = BookingService;
