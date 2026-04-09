const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email(),
    phone: z.string().min(8).optional(),
    password: z.string().min(8)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

module.exports = {
  registerSchema,
  loginSchema
};
