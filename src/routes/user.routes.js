'use strict';

const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(authenticate);

router.get('/me',               UserController.getProfile);
router.put('/me',               UserController.updateProfile);
router.post('/me/avatar',       upload.single('avatar'), UserController.updateAvatar);
router.put('/me/change-password', UserController.changePassword);
router.get('/me/bookings',      UserController.getBookingHistory);
router.get('/me/loyalty',       UserController.getLoyaltyInfo);

module.exports = router;
