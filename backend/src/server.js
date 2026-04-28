// server.js
const app = require('./app');
// Use Render's PORT or fallback to 4000 for local development
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
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