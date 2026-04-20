'use strict';

const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Upload ảnh lên Cloudinary từ buffer (memory storage).
 * @param {Buffer} buffer
 * @param {string} folder - Thư mục trên Cloudinary
 */
async function uploadToCloudinary(buffer, folder = 'webxemphim') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { upload, uploadToCloudinary };
