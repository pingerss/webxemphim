'use strict';

require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect to MySQL
    await connectDB();
    logger.info('  MySQL connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('  Redis connected successfully');

    // Start background workers (BullMQ)
    require('./workers');
    logger.info('  Background workers started');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`  Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('  Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
