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
  if (!origin || origin === "null") {
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
app.use(express.urlencoded({ extended: true }));

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

app.get("/mock-momo-approval/:reference", async (req, res, next) => {
  try {
    const { reference } = req.params;
    const pool = require("./db/pool");
    const result = await pool.query(
      "SELECT p.*, u.full_name, u.email FROM payments p JOIN users u ON p.user_id = u.id WHERE p.external_reference = $1",
      [reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Payment Not Found - Prosperous</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              h1 { color: #f43f5e; margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Payment Not Found</h1>
              <p>The payment reference <strong>${reference}</strong> could not be found or has expired.</p>
            </div>
          </body>
        </html>
      `);
    }

    const payment = result.rows[0];

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Prosperous Simulated MoMo Prompt</title>
          <style>
            :root {
              --bg: #0b0f19;
              --panel: #161f30;
              --text: #f1f5f9;
              --text-muted: #94a3b8;
              --primary: #38bdf8;
              --primary-hover: #0ea5e9;
              --success: #10b981;
              --danger: #ef4444;
            }
            body {
              background: var(--bg);
              color: var(--text);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              width: 100%;
              max-width: 420px;
              padding: 20px;
            }
            .card {
              background: var(--panel);
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
              padding: 30px;
              border: 1px solid rgba(255, 255, 255, 0.05);
              text-align: center;
            }
            .logo {
              font-weight: 800;
              font-size: 1.5rem;
              letter-spacing: -0.025em;
              color: var(--primary);
              margin-bottom: 20px;
              display: inline-block;
            }
            .phone-sim {
              background: #0f172a;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              border: 1px dashed rgba(56, 189, 248, 0.2);
              text-align: left;
            }
            .sim-title {
              font-size: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--primary);
              font-weight: 700;
              margin-bottom: 10px;
            }
            .prompt-bubble {
              background: #1e293b;
              border-radius: 8px;
              padding: 12px 16px;
              font-size: 0.9rem;
              line-height: 1.5;
              color: #e2e8f0;
            }
            .details-list {
              text-align: left;
              margin: 20px 0;
              font-size: 0.875rem;
              background: rgba(255, 255, 255, 0.02);
              padding: 15px;
              border-radius: 8px;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .details-row:last-child {
              border-bottom: none;
            }
            .label { color: var(--text-muted); }
            .value { font-weight: 600; color: #f8fafc; }
            .btn {
              width: 100%;
              padding: 12px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 0.95rem;
              cursor: pointer;
              border: none;
              transition: all 0.2s ease;
              margin-top: 10px;
            }
            .btn-success {
              background: var(--success);
              color: white;
            }
            .btn-success:hover {
              background: #059669;
              transform: translateY(-1px);
            }
            .btn-danger {
              background: rgba(239, 68, 68, 0.1);
              color: var(--danger);
              border: 1px solid rgba(239, 68, 68, 0.2);
            }
            .btn-danger:hover {
              background: rgba(239, 68, 68, 0.2);
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              background: rgba(234, 179, 8, 0.1);
              color: #facc15;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <span class="logo">PROSPEROUS</span>
              <div>
                <span class="status-badge">${payment.status}</span>
              </div>
              <h2 style="margin: 0; font-size: 1.25rem;">Simulated Mobile Money Prompt</h2>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 8px;">
                You are in development mode. Confirm or decline the simulated transaction.
              </p>

              <div class="phone-sim">
                <div class="sim-title">MTN Mobile Money</div>
                <div class="prompt-bubble">
                  Authorize payment of <b>GHS ${payment.amount}</b> to Prosperous Data Hub? Enter PIN to confirm.
                </div>
              </div>

              <div class="details-list">
                <div class="details-row">
                  <span class="label">Reference</span>
                  <span class="value">${payment.external_reference}</span>
                </div>
                <div class="details-row">
                  <span class="label">Amount</span>
                  <span class="value" style="color: #10b981;">GHS ${payment.amount}</span>
                </div>
                <div class="details-row">
                  <span class="label">User</span>
                  <span class="value">${payment.full_name}</span>
                </div>
                <div class="details-row">
                  <span class="label">Phone</span>
                  <span class="value">${payment.momo_number}</span>
                </div>
              </div>

              <form action="/mock-momo-approval/${reference}/resolve" method="POST">
                <input type="hidden" name="status" value="SUCCESS">
                <button type="submit" class="btn btn-success">Approve Payment (Confirm PIN)</button>
              </form>

              <form action="/mock-momo-approval/${reference}/resolve" method="POST" style="margin-top: 5px;">
                <input type="hidden" name="status" value="FAILED">
                <button type="submit" class="btn btn-danger">Decline Payment (Cancel)</button>
              </form>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});

app.post("/mock-momo-approval/:reference/resolve", async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { status } = req.body;
    const paymentService = require("./modules/payment/payment.service");

    const result = await paymentService.handleCallback({
      externalReference: reference,
      status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
      providerReference: `MOCK-MOMO-${Date.now()}`,
      reason: status === "SUCCESS" ? undefined : "User cancelled the prompt"
    });

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Simulated MoMo Status</title>
          <style>
            :root {
              --bg: #0b0f19;
              --panel: #161f30;
              --text: #f1f5f9;
              --text-muted: #94a3b8;
              --success: #10b981;
              --danger: #ef4444;
            }
            body {
              background: var(--bg);
              color: var(--text);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: var(--panel);
              border-radius: 16px;
              padding: 30px;
              width: 100%;
              max-width: 380px;
              text-align: center;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }
            h1 {
              color: ${status === "SUCCESS" ? "var(--success)" : "var(--danger)"};
              margin-top: 0;
            }
            .btn {
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background: #38bdf8;
              color: #0b0f19;
              text-decoration: none;
              font-weight: 700;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${status === "SUCCESS" ? "Payment Approved!" : "Payment Declined"}</h1>
            <p>Simulated callback successfully processed with status: <strong>${status}</strong>.</p>
            <p style="color: var(--text-muted); font-size: 0.875rem;">You can now close this tab and return to the dashboard.</p>
            <a href="javascript:window.close()" class="btn">Close Tab</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
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