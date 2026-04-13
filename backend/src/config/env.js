const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const defaultAppBaseUrl = process.env.RENDER_EXTERNAL_URL || "http://localhost:4000";

const envSchema = z
  .object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z
    .string()
    .default(process.env.NODE_ENV === "production" ? "*" : "http://localhost:3000"),
  APP_BASE_URL: z.string().url().default(defaultAppBaseUrl),
  PAYMENT_PROVIDER: z.enum(["SIMULATED", "HUBTEL", "EXPRESSPAY"]).default("SIMULATED"),
  HUBTEL_CLIENT_ID: z.string().optional(),
  HUBTEL_CLIENT_SECRET: z.string().optional(),
  HUBTEL_SIGNING_SECRET: z.string().optional(),
  HUBTEL_BASE_URL: z.string().optional(),
  EXPRESSPAY_API_KEY: z.string().optional(),
  EXPRESSPAY_SIGNING_SECRET: z.string().optional(),
  EXPRESSPAY_BASE_URL: z.string().optional(),
  PAYMENT_CALLBACK_TOKEN: z.string().min(8).default("change_me_callback_token"),
  PAYMENT_CALLBACK_PROVIDER: z.enum(["TOKEN", "HUBTEL", "EXPRESSPAY", "AUTO"]).default("AUTO"),
  HUBTEL_CALLBACK_SECRET: z.string().optional(),
  EXPRESSPAY_CALLBACK_SECRET: z.string().optional(),
  VTU_PROVIDER: z.enum(["SIMULATED", "REAL"]).default("SIMULATED"),
  VTU_API_KEY: z.string().optional(),
  VTU_BASE_URL: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@prosperoushub.com")
  })
  .superRefine((env, ctx) => {
    if (env.VTU_PROVIDER === "REAL") {
      if (!env.VTU_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["VTU_API_KEY"],
          message: "VTU_API_KEY is required when VTU_PROVIDER=REAL"
        });
      }

      if (!env.VTU_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["VTU_BASE_URL"],
          message: "VTU_BASE_URL is required when VTU_PROVIDER=REAL"
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
