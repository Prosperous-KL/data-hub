const express = require("express");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const { registerSchema, loginSchema } = require("./auth.validation");
const authService = require("./auth.service");

const router = express.Router();

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.validated.body);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.validated.body);
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
