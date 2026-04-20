'use strict';

const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { body } = require('express-validator');

const registerRules = [
  body('full_name').notEmpty().withMessage('Họ tên không được để trống'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
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
