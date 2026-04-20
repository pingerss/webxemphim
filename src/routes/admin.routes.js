'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

// Tất cả admin routes yêu cầu đăng nhập + role admin
router.use(authenticate, authorize('admin'));

// Movies management
const AdminMovieController = require('../controllers/admin/adminMovie.controller');
router.get('/movies',              AdminMovieController.getAll);
router.get('/movies/:id',          AdminMovieController.getById);
router.post('/movies',             upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'backdrop', maxCount: 1 }]), AdminMovieController.create);
router.put('/movies/:id',          upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'backdrop', maxCount: 1 }]), AdminMovieController.update);
router.delete('/movies/:id',       AdminMovieController.remove);

// Rooms (1 rạp duy nhất — chỉ quản lý phòng)
const AdminCinemaController = require('../controllers/admin/adminCinema.controller');
router.get('/rooms',                        AdminCinemaController.getRooms);           // Danh sách phòng
router.post('/rooms',                       AdminCinemaController.createRoom);         // Thêm phòng mới
router.put('/rooms/:id',                    AdminCinemaController.updateRoom);         // Sửa phòng
router.delete('/rooms/:id',                 AdminCinemaController.removeRoom);         // Xóa phòng
router.post('/rooms/:id/seats/generate',    AdminCinemaController.generateSeats);      // Tạo tự động ma trận ghế
router.get('/rooms/:id/seats',             AdminCinemaController.getSeats);           // Xem ghế của phòng


// Showtimes
const AdminShowtimeController = require('../controllers/admin/adminShowtime.controller');
router.get('/showtimes',           AdminShowtimeController.getAll);
router.post('/showtimes',          AdminShowtimeController.create); // Kiểm tra trùng lịch
router.put('/showtimes/:id',       AdminShowtimeController.update);
router.delete('/showtimes/:id',    AdminShowtimeController.remove);

// Users
const AdminUserController = require('../controllers/admin/adminUser.controller');
router.get('/users',               AdminUserController.getAll);
router.put('/users/:id/toggle',    AdminUserController.toggleActive);
router.put('/users/:id/role',      AdminUserController.changeRole);

// Combos
const AdminComboController = require('../controllers/admin/adminCombo.controller');
router.get('/combos',              AdminComboController.getAll);
router.post('/combos',             upload.single('image'), AdminComboController.create);
router.put('/combos/:id',          upload.single('image'), AdminComboController.update);
router.delete('/combos/:id',       AdminComboController.remove);

// Promotions & Vouchers
const AdminPromotionController = require('../controllers/admin/adminPromotion.controller');
router.get('/promotions',              AdminPromotionController.getAll);
router.post('/promotions',             AdminPromotionController.create);
router.put('/promotions/:id',          AdminPromotionController.update);
router.delete('/promotions/:id',       AdminPromotionController.remove);
router.post('/promotions/:id/vouchers', AdminPromotionController.generateVouchers); // Tạo bulk voucher

// Dashboard
const AdminDashboardController = require('../controllers/admin/adminDashboard.controller');
router.get('/dashboard/stats',     AdminDashboardController.getStats);
router.get('/dashboard/revenue',   AdminDashboardController.getRevenue);

module.exports = router;
