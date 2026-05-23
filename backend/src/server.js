// server.js
const app = require('./app');
const logger = require('./utils/logger');
const { startCleanupJobs } = require('./cron/cleanup');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  startCleanupJobs();
});

// Graceful error handling
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err });
  process.exit(1);
});

server.on('error', (err) => {
  logger.error('Server error', { error: err });
  process.exit(1);
});

// Graceful shutdown
const pool = require('./db/pool');
const shutdown = () => {
  logger.info('Gracefully shutting down...');
  
  server.close(async () => {
    logger.info('Closed out remaining HTTP connections.');
    try {
      await pool.end();
      logger.info('Database pool closed.');
    } catch (err) {
      logger.error('Error closing database pool', { error: err });
    }
    process.exit(0);
  });

  // Force close after 10s if requests hang
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);