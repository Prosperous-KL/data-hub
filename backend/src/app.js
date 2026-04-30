const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const transactionRoutes = require("./modules/transaction/transaction.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const vtuRoutes = require("./modules/vtu/vtu.routes");
const bundleRoutes = require("./modules/bundle/bundle.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const storeRoutes = require("./modules/store/store.routes");

const app = express();
app.set("trust proxy", 1);
const configuredOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAnyOrigin = configuredOrigins.includes("*");
const hasConfiguredOrigins = configuredOrigins.length > 0;

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const isRenderOrigin = /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin);
  if (isRenderOrigin) {
    return true;
  }

  if (allowAnyOrigin || !hasConfiguredOrigins) {
    return true;
  }

  return configuredOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) {
      return true;
    }

    if (!allowedOrigin.includes("*")) {
      return false;
    }

    const escapedPattern = allowedOrigin
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");

    return new RegExp(`^${escapedPattern}$`).test(origin);
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(
      `CORS blocked for origin: ${origin}. Set CORS_ORIGIN to include this origin.`
    );
    corsError.statusCode = 403;
    corsError.code = "CORS_ERROR";
    return callback(corsError);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ success: true, service: "Prosperous Data Hub API" });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Prosperous Data Hub API",
    message: "API is running. Use /health or /api/* endpoints."
  });
});

console.log("[app] mounting auth routes at /api/auth");
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/data", vtuRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/store", storeRoutes);

app.use(notFound);
app.use(errorHandler);



module.exports = app;