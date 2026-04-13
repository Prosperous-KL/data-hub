require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dataRoutes = require("./routes/dataRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  console.log(`[request] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  "/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "Prosperous Data Hub VTU API",
    status: "healthy"
  });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Prosperous Data Hub VTU API",
    message: "API is running. Use POST /buy-data or POST /api/data/buy."
  });
});

app.use(dataRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: "Route not found"
  });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Something went wrong",
    details: err.details || undefined
  });
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Prosperous Data Hub VTU API running on port ${PORT}`);
  });
}

module.exports = app;