'use strict';

const { Queue, Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

let bookingExpireQueue;

function getQueues() {
  const connection = getRedisClient();

  // Queue nhả ghế khi hết hạn
  bookingExpireQueue = new Queue('booking-expire', { connection });

  return { bookingExpireQueue };
}

function startWorkers() {
  const connection = getRedisClient();

  // Worker tự động quét và hủy booking hết hạn
  const expireWorker = new Worker(
    'booking-expire',
    async () => {
      const BookingService = require('../services/booking.service');
      const count = await BookingService.expireOverdueBookings();
      if (count > 0) logger.info(`🔄  Expired ${count} overdue bookings`);
    },
    { connection }
  );

  expireWorker.on('completed', () => {});
  expireWorker.on('failed', (job, err) => logger.error(`Booking expire job failed:`, err));

  // Repeat job mỗi 60 giây
  bookingExpireQueue.add('expire-check', {}, {
    repeat: { every: 60 * 1000 }, // mỗi 1 phút
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  logger.info('✅  BullMQ workers registered');
}

module.exports = function initWorkers() {
  getQueues();
  startWorkers();
};
