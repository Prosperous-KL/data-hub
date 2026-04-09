function notFound(_req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Something went wrong"
  });
}

module.exports = {
  notFound,
  errorHandler
};
