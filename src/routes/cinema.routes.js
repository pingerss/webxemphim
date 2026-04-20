'use strict';

const router = require('express').Router();
const CinemaController = require('../controllers/cinema.controller');

// Chỉ 1 rạp duy nhất — lấy thông tin rạp + danh sách phòng
router.get('/info',  CinemaController.getInfo);   // GET /cinemas/info
router.get('/rooms', CinemaController.getRooms);  // GET /cinemas/rooms

module.exports = router;
