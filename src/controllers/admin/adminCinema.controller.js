'use strict';

const CinemaService = require('../../services/cinema.service');
const ApiResponse = require('../../utils/apiResponse.util');
const { Seat, SeatType } = require('../../models');

const AdminCinemaController = {
  // Danh sách phòng của rạp
  async getRooms(req, res, next) {
    try {
      return ApiResponse.success(res, await CinemaService.getRooms());
    } catch (err) { next(err); }
  },

  // Thêm phòng mới (cinema_id tự gán = 1 trong service)
  async createRoom(req, res, next) {
    try {
      const room = await CinemaService.createRoom(req.body);
      return ApiResponse.created(res, room, 'Thêm phòng thành công');
    } catch (err) { next(err); }
  },

  // Sửa phòng
  async updateRoom(req, res, next) {
    try {
      const room = await CinemaService.updateRoom(req.params.id, req.body);
      return ApiResponse.success(res, room, 'Cập nhật phòng thành công');
    } catch (err) { next(err); }
  },

  // Xóa phòng (soft delete)
  async removeRoom(req, res, next) {
    try {
      await CinemaService.removeRoom(req.params.id);
      return ApiResponse.success(res, null, 'Xóa phòng thành công');
    } catch (err) { next(err); }
  },

  // Xem danh sách ghế của phòng
  async getSeats(req, res, next) {
    try {
      const seats = await Seat.findAll({
        where: { room_id: req.params.id },
        include: [{ model: SeatType, as: 'seatType' }],
        order: [['row_label', 'ASC'], ['col_number', 'ASC']],
      });
      return ApiResponse.success(res, seats);
    } catch (err) { next(err); }
  },

  /**
   * Tự động tạo ma trận ghế cho phòng.
   * Body: {
   *   default_type_id: 1,      // SeatType id mặc định (ghế Thường)
   *   vip_rows: ['G', 'H'],    // Các hàng VIP (optional)
   *   vip_type_id: 2,          // SeatType id VIP
   *   couple_cols: [11, 12],   // Cột Couple (optional)
   *   couple_type_id: 3        // SeatType id Couple
   * }
   */
  async generateSeats(req, res, next) {
    try {
      const data = await CinemaService.generateSeats(req.params.id, req.body);
      return ApiResponse.created(res, data, `Đã tạo ${data.count} ghế thành công`);
    } catch (err) { next(err); }
  },
};

module.exports = AdminCinemaController;
