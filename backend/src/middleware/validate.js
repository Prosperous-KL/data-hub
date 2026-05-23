const ApiError = require("../utils/apiError");

function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });

    if (!parsed.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[validate] Validation failed:", JSON.stringify(parsed.error.errors, null, 2));
      }
      return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", parsed.error.errors));
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = validate;
