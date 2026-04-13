const { z } = require("zod");

const otpCodeSchema = z.string().regex(/^\d{6}$/, "OTP code must be 6 digits");

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().min(8),
    password: z.string().min(8),
    otpSessionId: z.string().uuid(),
    otpCode: otpCodeSchema
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const otpRequestSchema = z.object({
  body: z.object({
    purpose: z.enum(["REGISTER", "PASSWORD_RESET"]),
    channel: z.enum(["EMAIL", "PHONE"]),
    target: z.string().min(4)
  })
});

const passwordRecoveryRequestSchema = z.object({
  body: z.object({
    identifier: z.string().min(4),
    channel: z.enum(["EMAIL", "PHONE"]).optional()
  })
});

const passwordResetSchema = z.object({
  body: z.object({
    identifier: z.string().min(4),
    otpSessionId: z.string().uuid(),
    otpCode: otpCodeSchema,
    newPassword: z.string().min(8)
  })
});

const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(8)
  })
});

const updateUsernameSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100)
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  passwordRecoveryRequestSchema,
  passwordResetSchema,
  deleteAccountSchema,
  updateUsernameSchema
};
