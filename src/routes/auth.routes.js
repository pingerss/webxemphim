'use strict';

const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { body } = require('express-validator');

const registerRules = [
  body('full_name').notEmpty().withMessage('Họ tên không được để trống').trim(),
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  // Tùy chọn (optional)
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('date_of_birth')
    .optional({ nullable: true, checkFalsy: true })
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)'),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ (male/female/other)'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];

router.post('/register', registerRules, validate, AuthController.register);
router.post('/login',    loginRules,    validate, AuthController.login);
router.post('/refresh',  AuthController.refreshToken);
router.post('/logout',   authenticate,  AuthController.logout);
router.get('/me',        authenticate,  AuthController.getMe);
router.post('/forgot-password',   AuthController.forgotPassword);
router.post('/reset-password',    AuthController.resetPassword);

module.exports = router;
