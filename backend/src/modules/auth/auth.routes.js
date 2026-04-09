const express = require("express");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const { registerSchema, loginSchema } = require("./auth.validation");
const authService = require("./auth.service");

const router = express.Router();

console.log("[auth.routes] loaded");

router.get("/", (_req, res) => {
  return res.json({
    success: true,
    message: "Auth routes are available",
    routes: ["GET /", "GET /login", "GET /register", "POST /register", "POST /login", "GET /me"]
  });
});

router.get("/login", (_req, res) => {
  return res.status(200).json({
    success: false,
    message: "Use POST /login"
  });
});

router.get("/register", (_req, res) => {
  return res.status(200).json({
    success: false,
    message: "Use POST /register"
  });
});

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
    const { email, password } = req.validated.body || req.body;
    const { token, user } = await authService.login({ email, password });

    return res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
