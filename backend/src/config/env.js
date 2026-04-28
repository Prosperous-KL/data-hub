const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const defaultAppBaseUrl = process.env.RENDER_EXTERNAL_URL || "http://localhost:4000";

function optionalEmailFromEnv() {
  return z.preprocess((value) => (value === "" ? undefined : value), z.string().email().optional());
}

const envSchema = z
  .object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("postgresql://localhost/datahubdb_placeholder"),
  JWT_SECRET: z.string().default("change-me-render-placeholder-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z
    .string()
    .default(process.env.NODE_ENV === "production" ? "*" : "http://localhost:3000"),
  APP_BASE_URL: z.string().url().default(defaultAppBaseUrl),
  SMTP_GMAIL_USER: optionalEmailFromEnv(),
  SMTP_GMAIL_APP_PASSWORD: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("Prosperous Data Hub"),
  HUBTEL_SMS_BASE_URL: z.string().url().default("https://smsc.hubtel.com/v1/messages/send"),
  HUBTEL_SMS_CLIENT_ID: z.string().optional(),
  HUBTEL_SMS_CLIENT_SECRET: z.string().optional(),
  HUBTEL_SMS_FROM: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["SIMULATED", "MTN", "HUBTEL", "EXPRESSPAY"]).default("SIMULATED"),
  MTN_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  MTN_BASE_URL: z.string().url().optional(),
  MTN_COLLECTION_PRIMARY_KEY: z.string().optional(),
  MTN_COLLECTION_USER_ID: z.string().optional(),
  MTN_COLLECTION_API_KEY: z.string().optional(),
  MTN_COLLECTION_SUBSCRIPTION_KEY: z.string().optional(),
  MTN_TARGET_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  MTN_CURRENCY: z.string().default("GHS"),
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
    if (env.PAYMENT_PROVIDER === "HUBTEL") {
      if (!env.HUBTEL_CLIENT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_CLIENT_ID"],
          message: "HUBTEL_CLIENT_ID is required when PAYMENT_PROVIDER=HUBTEL"
        });
      }

      if (!env.HUBTEL_CLIENT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_CLIENT_SECRET"],
          message: "HUBTEL_CLIENT_SECRET is required when PAYMENT_PROVIDER=HUBTEL"
        });
      }

      if (!env.HUBTEL_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_BASE_URL"],
          message: "HUBTEL_BASE_URL is required when PAYMENT_PROVIDER=HUBTEL"
        });
      }
    }

    if (env.PAYMENT_PROVIDER === "MTN") {
      if (!env.MTN_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MTN_BASE_URL"],
          message: "MTN_BASE_URL is required when PAYMENT_PROVIDER=MTN"
        });
      }

      if (!env.MTN_COLLECTION_USER_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MTN_COLLECTION_USER_ID"],
          message: "MTN_COLLECTION_USER_ID is required when PAYMENT_PROVIDER=MTN"
        });
      }

      if (!env.MTN_COLLECTION_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MTN_COLLECTION_API_KEY"],
          message: "MTN_COLLECTION_API_KEY is required when PAYMENT_PROVIDER=MTN"
        });
      }

      if (!env.MTN_COLLECTION_SUBSCRIPTION_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MTN_COLLECTION_SUBSCRIPTION_KEY"],
          message: "MTN_COLLECTION_SUBSCRIPTION_KEY is required when PAYMENT_PROVIDER=MTN"
        });
      }
    }

    if (env.HUBTEL_SMS_CLIENT_ID || env.HUBTEL_SMS_CLIENT_SECRET || env.HUBTEL_SMS_FROM) {
      if (!env.HUBTEL_SMS_CLIENT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_SMS_CLIENT_ID"],
          message: "HUBTEL_SMS_CLIENT_ID is required when Hubtel SMS delivery is configured"
        });
      }

      if (!env.HUBTEL_SMS_CLIENT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_SMS_CLIENT_SECRET"],
          message: "HUBTEL_SMS_CLIENT_SECRET is required when Hubtel SMS delivery is configured"
        });
      }

      if (!env.HUBTEL_SMS_FROM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["HUBTEL_SMS_FROM"],
          message: "HUBTEL_SMS_FROM is required when Hubtel SMS delivery is configured"
        });
      }
    }

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
