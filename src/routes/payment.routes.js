'use strict';

const router = require('express').Router();
const PaymentController = require('../controllers/payment.controller');

// VNPay callback (không cần JWT, VNPay gọi về)
router.get('/vnpay/return',  PaymentController.vnpayReturn); // Redirect từ VNPay
router.post('/vnpay/ipn',    PaymentController.vnpayIpn);    // IPN webhook từ VNPay

module.exports = router;
