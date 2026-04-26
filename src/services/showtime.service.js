'use strict';

const { Op } = require('sequelize');
const { Showtime, Movie, Room, Cinema, Seat, SeatType, Booking, BookingTicket } = require('../models');
const { getRedisClient } = require('../config/redis');
const { seatLockKey } = require('../utils/helpers.util');
const AppError = require('../utils/AppError');

const ShowtimeService = {
  // Filter: movie_id, room_id, date
  async getAll({ movie_id, room_id, date }) {
    const where = { is_active: true };
    if (movie_id) where.movie_id = movie_id;
    if (room_id) where.room_id = room_id;
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.start_time = { [Op.gte]: d, [Op.lt]: next };
    }

    return Showtime.findAll({
      where,
      include: [
        { model: Movie, as: 'movie', attributes: ['id', 'title', 'duration', 'poster_url', 'age_rating'] },
        { model: Room, as: 'room', attributes: ['id', 'name', 'room_type'] },
      ],
      order: [['start_time', 'ASC']],
    });
  },

  async getById(id) {
    return Showtime.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room', include: [{ model: Cinema, as: 'cinema' }] },
      ],
    });
  },

  /**
   * Lấy sơ đồ ghế kèm trạng thái real-time:
   * 'available' | 'booked' (từ DB) | 'held' (từ Redis TTL)
   */
  async getSeatMap(showtimeId) {
    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime) throw new AppError('Không tìm thấy suất chiếu', 404);

    // 1. Lấy tất cả ghế của phòng
    const seats = await Seat.findAll({
      where: { room_id: showtime.room_id, is_active: true },
      include: [{ model: SeatType, as: 'seatType' }],
      order: [['row_label', 'ASC'], ['col_number', 'ASC']],
    });

    // 2. Lấy ghế đã booked từ DB (trạng thái paid)
    const bookedTickets = await BookingTicket.findAll({
      include: [{
        model: Booking,
        where: { 
          showtime_id: showtimeId, 
          [Op.or]: [
            { status: 'paid' },
            { status: 'pending', hold_expires_at: { [Op.gt]: new Date() } }
          ]
        },
        attributes: ['status'],
      }],
    });
    const bookedSeatIds = new Set(bookedTickets.map(t => t.seat_id));

    // 3. Kiểm tra ghế đang held từ Redis
    const redis = getRedisClient();
    const seatStatuses = await Promise.all(
      seats.map(async (seat) => {
        let status = 'available';
        if (bookedSeatIds.has(seat.id)) {
          const booking = bookedTickets.find(t => t.seat_id === seat.id);
          status = booking?.Booking?.status === 'paid' ? 'booked' : 'held';
        } else {
          const held = await redis.exists(seatLockKey(showtimeId, seat.id));
          if (held) status = 'held';
        }
        return {
          ...seat.toJSON(),
          status,
          price: Math.round(showtime.base_price * seat.seatType.price_multiplier),
        };
      })
    );

    return { showtimeId, roomId: showtime.room_id, seats: seatStatuses };
  },

  /**
   * Kiểm tra xung đột lịch chiếu khi tạo/sửa suất chiếu.
   * Logic: thời gian chiếu mới không được đè lên bất kỳ suất nào đang hoạt động cùng phòng.
   */
  async checkConflict(roomId, startTime, endTime, excludeId = null) {
    const where = {
      room_id: roomId,
      is_active: true,
      [Op.or]: [
        { start_time: { [Op.between]: [startTime, endTime] } },
        { end_time: { [Op.between]: [startTime, endTime] } },
        { start_time: { [Op.lte]: startTime }, end_time: { [Op.gte]: endTime } },
      ],
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const conflict = await Showtime.findOne({ where });
    return conflict;
  },

  async create(payload) {
    const { movie_id, room_id, start_time, base_price, format, subtitle_type, cleaning_time_mins = 15 } = payload;

    const movie = await require('./movie.service').getById(movie_id);
    if (!movie) throw new AppError('Không tìm thấy phim', 404);

    const start = new Date(start_time);
    const endTime = new Date(start.getTime() + (movie.duration + cleaning_time_mins) * 60000);

    const conflict = await ShowtimeService.checkConflict(room_id, start, endTime);
    if (conflict) {
      throw new AppError(
        `Phòng đã có suất chiếu lúc ${conflict.start_time.toLocaleString('vi-VN')}. Vui lòng chọn thời gian khác.`,
        409
      );
    }

    return Showtime.create({ movie_id, room_id, start_time: start, end_time: endTime, base_price, format, subtitle_type, cleaning_time_mins });
  },

  async update(id, payload) {
    const showtime = await Showtime.findByPk(id);
    if (!showtime) throw new AppError('Không tìm thấy suất chiếu', 404);
    if (payload.start_time) {
      const movie = await require('./movie.service').getById(showtime.movie_id);
      const start = new Date(payload.start_time);
      const endTime = new Date(start.getTime() + (movie.duration + showtime.cleaning_time_mins) * 60000);
      const conflict = await ShowtimeService.checkConflict(showtime.room_id, start, endTime, id);
      if (conflict) throw new AppError('Thời gian bị trùng với suất chiếu khác', 409);
      payload.end_time = endTime;
    }
    return showtime.update(payload);
  },

  async remove(id) {
    const showtime = await Showtime.findByPk(id);
    if (!showtime) throw new AppError('Không tìm thấy suất chiếu', 404);
    await showtime.update({ is_active: false });
  },
};

module.exports = ShowtimeService;
