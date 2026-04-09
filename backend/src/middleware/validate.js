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
      return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR"));
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = validate;
