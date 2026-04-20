'use strict';

const router = require('express').Router();
const ShowtimeController = require('../controllers/showtime.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public
router.get('/',      ShowtimeController.getAll);
router.get('/:id',   ShowtimeController.getById);
router.get('/:id/seats', ShowtimeController.getSeatMap); // Sơ đồ ghế + trạng thái real-time

module.exports = router;
