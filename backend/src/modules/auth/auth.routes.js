const express = require("express");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  passwordRecoveryRequestSchema,
  passwordResetSchema,
  deleteAccountSchema,
  updateUsernameSchema,
  checkUsernameAvailabilitySchema
} = require("./auth.validation");
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

router.post("/otp/request", validate(otpRequestSchema), async (req, res, next) => {
  try {
    const result = await authService.requestOtp(req.validated.body);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.post("/password-recovery/request", validate(passwordRecoveryRequestSchema), async (req, res, next) => {
  try {
    const result = await authService.requestPasswordRecoveryOtp(req.validated.body);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.post("/password-recovery/reset", validate(passwordResetSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPasswordWithOtp(req.validated.body);
    return res.json({ success: true, ...result });
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

router.delete("/account", authRequired, validate(deleteAccountSchema), async (req, res, next) => {
  try {
    const result = await authService.deleteAccount({
      userId: req.user.sub,
      password: req.validated.body.password,
      otpSessionId: req.validated.body.otpSessionId,
      otpCode: req.validated.body.otpCode,
      channel: req.validated.body.channel
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.put("/username", authRequired, validate(updateUsernameSchema), async (req, res, next) => {
  try {
    const result = await authService.updateUsername({
      userId: req.user.sub,
      username: req.validated.body.username,
      fullName: req.validated.body.fullName
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.get("/username/check", validate(checkUsernameAvailabilitySchema), async (req, res, next) => {
  try {
    const username = req.validated.query.username;
    const isAvailable = await authService.checkUsernameAvailability(username);
    return res.json({
      success: true,
      username,
      available: isAvailable
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
