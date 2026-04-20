'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Tạo mã booking ngắn gọn: CS-XXXXXX (6 ký tự hex)
 */
function generateBookingCode() {
  return 'CS-' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

/**
 * Tạo khóa Redis cho seat lock.
 * @param {number} showtimeId
 * @param {number} seatId
 */
function seatLockKey(showtimeId, seatId) {
  return `seat_lock:showtime_${showtimeId}:seat_${seatId}`;
}

/**
 * Tạo khóa Redis cho booking hold.
 * @param {string} bookingCode
 */
function bookingHoldKey(bookingCode) {
  return `booking_hold:${bookingCode}`;
}

/**
 * Parse pagination params từ query string.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { generateBookingCode, seatLockKey, bookingHoldKey, parsePagination };
