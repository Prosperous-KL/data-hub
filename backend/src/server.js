// server.js
const app = require('./app');
// Use Render's PORT or fallback to 4000 for local development
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});