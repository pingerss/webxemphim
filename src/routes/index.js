'use strict';

const router = require('express').Router();

const API_VERSION = process.env.API_VERSION || 'v1';
const base = `/${API_VERSION}`;

router.use(`${base}/auth`,       require('./auth.routes'));
router.use(`${base}/movies`,     require('./movie.routes'));
router.use(`${base}/genres`,     require('./genre.routes'));
router.use(`${base}/cinemas`,    require('./cinema.routes'));
router.use(`${base}/showtimes`,  require('./showtime.routes'));
router.use(`${base}/bookings`,   require('./booking.routes'));
router.use(`${base}/payments`,   require('./payment.routes'));
router.use(`${base}/combos`,     require('./combo.routes'));
router.use(`${base}/promotions`, require('./promotion.routes'));
router.use(`${base}/users`,      require('./user.routes'));
router.use(`${base}/admin`,      require('./admin.routes'));

module.exports = router;
