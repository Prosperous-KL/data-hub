const env = require("../config/env");

function notFound(_req, res) {
  return res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Resource not found"
  });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isProduction = env.NODE_ENV === "production";
  
  // Extract safe provider messages (from payment providers, etc.)
  const providerMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.description;

  // Determine safe user message
  let userMessage = err.message || providerMessage || "An error occurred";
  
  // In production, don't expose internal error details
  if (isProduction && !err.code) {
    userMessage = "Internal server error";
  }

  const response = {
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: userMessage
  };

  if (!isProduction && err.details) {
    response.details = err.details;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler
};
