'use strict';

const jwt = require('jsonwebtoken');

/**
 * Tạo Access Token (ngắn hạn)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Tạo Refresh Token (dài hạn)
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
