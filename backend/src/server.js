// server.js
import app from './app.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful error handling
process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});

server.on('error', (err) => {
  console.error('[Server] Error:', err);
  process.exit(1);
});