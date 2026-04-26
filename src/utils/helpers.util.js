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

/**
 * Tạo slug chuẩn từ chuỗi (hỗ trợ tiếng Việt)
 */
function generateSlug(str) {
  if (!str) return '';
  let slug = str.toLowerCase();
  slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
  slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
  slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
  slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
  slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
  slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
  slug = slug.replace(/đ/gi, 'd');
  slug = slug.replace(/[^a-z0-9 -]/g, ''); // Xóa ký tự đặc biệt
  slug = slug.replace(/\s+/g, '-'); // Trắng => Gạch ngang
  slug = slug.replace(/-+/g, '-'); // Xóa gạch ngang thừa
  slug = slug.replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu và cuối
  return slug;
}

module.exports = { generateSlug, generateBookingCode, seatLockKey, bookingHoldKey, parsePagination };
