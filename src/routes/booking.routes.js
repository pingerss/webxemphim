'use strict';

const router = require('express').Router();
const BookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Tất cả booking routes yêu cầu đăng nhập
router.use(authenticate);

router.post('/hold',        BookingController.holdSeats);     // Giữ ghế 5 phút
router.post('/checkout',    BookingController.checkout);      // Tạo link VNPay, gia hạn 15'
router.get('/my',           BookingController.getMyBookings); // Lịch sử đặt vé
router.get('/:id',          BookingController.getById);       // Chi tiết đơn
router.delete('/:id/cancel', BookingController.cancel);       // Hủy đơn

module.exports = router;
