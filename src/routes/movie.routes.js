'use strict';

const router = require('express').Router();
const MovieController = require('../controllers/movie.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

// Public routes
router.get('/',                 MovieController.getAll);
router.get('/now-showing',      MovieController.getNowShowing);
router.get('/coming-soon',      MovieController.getComingSoon);
router.get('/:id',              MovieController.getById);
router.get('/:id/showtimes',    MovieController.getShowtimes);
router.get('/:id/reviews',      MovieController.getReviews);

// Customer routes
router.post('/:id/reviews', authenticate, MovieController.addReview);

module.exports = router;
