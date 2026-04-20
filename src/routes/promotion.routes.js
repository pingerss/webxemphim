'use strict';

const router = require('express').Router();
const PromotionController = require('../controllers/promotion.controller');

router.get('/', PromotionController.getActive);
router.post('/validate', PromotionController.validateVoucher); // Kiểm tra voucher code

module.exports = router;
