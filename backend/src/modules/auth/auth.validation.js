const { z } = require("zod");

const otpCodeSchema = z.string().regex(/^P\d{6}$/, "OTP code must start with P followed by 6 digits");
const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function normalizePhoneInput(value) {
  return String(value || "").replace(/[\s-]/g, "").trim();
}

function isValidGhanaPhone(value) {
  return ghPhoneRegex.test(normalizePhoneInput(value));
}

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().refine(isValidGhanaPhone, "Phone must be a valid Ghana number"),
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
    purpose: z.enum(["REGISTER", "PASSWORD_RESET", "ACCOUNT_DELETE"]),
    channel: z.enum(["EMAIL", "PHONE"]),
    target: z.string().min(4)
  }).superRefine((value, ctx) => {
    if (value.channel === "PHONE" && !isValidGhanaPhone(value.target)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target must be a valid Ghana phone number",
        path: ["target"]
      });
    }
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
    password: z.string().min(8),
    otpSessionId: z.string().uuid(),
    otpCode: otpCodeSchema,
    channel: z.enum(["EMAIL", "PHONE"])
  })
});

const updateUsernameSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(/^[a-z0-9._-]+$/, "Username can only contain lowercase letters, numbers, dots, hyphens, and underscores"),
    fullName: z.string()
      .min(2, "Display name must be at least 2 characters")
      .max(120, "Display name must not exceed 120 characters")
  })
});

const checkUsernameAvailabilitySchema = z.object({
  query: z.object({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  passwordRecoveryRequestSchema,
  passwordResetSchema,
  deleteAccountSchema,
  updateUsernameSchema,
  checkUsernameAvailabilitySchema
};
