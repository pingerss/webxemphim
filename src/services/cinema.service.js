'use strict';

const { Cinema, Room, Seat, SeatType } = require('../models');
const AppError = require('../utils/AppError');

// ID rạp duy nhất — cố định là 1
const CINEMA_ID = 1;

const CinemaService = {
  // Lấy thông tin rạp duy nhất
  async getInfo() {
    const cinema = await Cinema.findByPk(CINEMA_ID);
    if (!cinema) throw new AppError('Rạp chưa được cấu hình', 404);
    return cinema;
  },

  // Lấy danh sách phòng của rạp duy nhất
  async getRooms() {
    return Room.findAll({
      where: { cinema_id: CINEMA_ID, is_active: true },
      order: [['name', 'ASC']],
    });
  },

  // ── Admin: Quản lý phòng ──────────────────────────────────

  async createRoom(payload) {
    return Room.create({ ...payload, cinema_id: CINEMA_ID });
  },

  async updateRoom(roomId, payload) {
    const room = await Room.findOne({ where: { id: roomId, cinema_id: CINEMA_ID } });
    if (!room) throw new AppError('Không tìm thấy phòng chiếu', 404);
    return room.update(payload);
  },

  async removeRoom(roomId) {
    const room = await Room.findOne({ where: { id: roomId, cinema_id: CINEMA_ID } });
    if (!room) throw new AppError('Không tìm thấy phòng chiếu', 404);
    await room.update({ is_active: false });
  },

  /**
   * Tự động tạo ma trận ghế cho phòng dựa trên total_rows x total_cols.
   * Ví dụ: 8 hàng (A-H) x 12 cột = 96 ghế
   * vip_rows: ['G','H'] → hàng G,H là ghế VIP
   * couple_cols: [11,12] → cột 11,12 là ghế Couple
   */
  async generateSeats(roomId, { default_type_id, vip_rows = [], vip_type_id, couple_cols = [], couple_type_id }) {
    const room = await Room.findOne({ where: { id: roomId, cinema_id: CINEMA_ID } });
    if (!room) throw new AppError('Không tìm thấy phòng chiếu', 404);

    // Xóa ghế cũ
    await Seat.destroy({ where: { room_id: roomId } });

    // Tạo nhãn hàng: A, B, C, ... theo total_rows
    const rows = Array.from({ length: room.total_rows }, (_, i) =>
      String.fromCharCode(65 + i) // ASCII: A=65, B=66...
    );

    const seats = [];
    for (const rowLabel of rows) {
      for (let col = 1; col <= room.total_cols; col++) {
        let seatTypeId = default_type_id;
        if (vip_rows.includes(rowLabel) && vip_type_id) seatTypeId = vip_type_id;
        if (couple_cols.includes(col) && couple_type_id) seatTypeId = couple_type_id;

        seats.push({
          room_id: roomId,
          seat_type_id: seatTypeId,
          row_label: rowLabel,
          col_number: col,
          seat_name: `${rowLabel}${col}`,
        });
      }
    }

    const created = await Seat.bulkCreate(seats);
    return { count: created.length, seats: created };
  },
};

module.exports = CinemaService;
