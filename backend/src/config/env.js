import dotenv from "dotenv";
import { z } from "zod";

// Only load .env file in development
// Production uses Render environment variables
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

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
    .default("http://localhost:3000"),
  APP_BASE_URL: z.string().url().default(defaultAppBaseUrl),
  SMTP_GMAIL_USER: optionalEmailFromEnv(),
  SMTP_GMAIL_APP_PASSWORD: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("Prosperous Data Hub"),
  HUBTEL_SMS_BASE_URL: z.string().url().default("https://smsc.hubtel.com/v1/messages/send"),
  HUBTEL_SMS_CLIENT_ID: z.string().optional(),
  HUBTEL_SMS_CLIENT_SECRET: z.string().optional(),
  HUBTEL_SMS_FROM: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_TOKENINFO_URL: z.string().url().default("https://oauth2.googleapis.com/tokeninfo"),
  PAYMENT_PROVIDER: z.enum(["SIMULATED", "MTN", "HUBTEL", "EXPRESSPAY", "PAYSTACK"]).default("SIMULATED"),
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
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),
  PAYSTACK_CALLBACK_URL: z.string().url().optional(),
  PAYSTACK_CURRENCY: z.string().default("GHS"),
  PAYMENT_CALLBACK_TOKEN: z.string().min(8).default("change_me_callback_token"),
  PAYMENT_CALLBACK_PROVIDER: z.enum(["TOKEN", "HUBTEL", "EXPRESSPAY", "PAYSTACK", "AUTO"]).default("AUTO"),
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

    if (env.PAYMENT_PROVIDER === "PAYSTACK") {
      if (!env.PAYSTACK_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PAYSTACK_SECRET_KEY"],
          message: "PAYSTACK_SECRET_KEY is required when PAYMENT_PROVIDER=PAYSTACK"
        });
      }
    }

    if (env.PAYMENT_CALLBACK_PROVIDER === "PAYSTACK") {
      if (!env.PAYSTACK_WEBHOOK_SECRET && !env.PAYSTACK_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PAYSTACK_WEBHOOK_SECRET"],
          message: "PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY is required when PAYMENT_CALLBACK_PROVIDER=PAYSTACK"
        });
      }
    }

    // NOTE: Hubtel SMS is completely optional
    // Email fallback is available in otpDelivery.js
    // No validation required for SMS credentials - deployment should not fail without them

    // If Twilio WhatsApp vars are partially set, require them together
    if (env.TWILIO_ACCOUNT_SID || env.TWILIO_AUTH_TOKEN || env.TWILIO_WHATSAPP_FROM) {
      if (!env.TWILIO_ACCOUNT_SID) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["TWILIO_ACCOUNT_SID"], message: "TWILIO_ACCOUNT_SID is required when Twilio WhatsApp is configured" });
      }

      if (!env.TWILIO_AUTH_TOKEN) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["TWILIO_AUTH_TOKEN"], message: "TWILIO_AUTH_TOKEN is required when Twilio WhatsApp is configured" });
      }

      if (!env.TWILIO_WHATSAPP_FROM) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["TWILIO_WHATSAPP_FROM"], message: "TWILIO_WHATSAPP_FROM is required when Twilio WhatsApp is configured" });
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

const env = parsed.data;

// Production security checks
if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET === "change-me-render-placeholder-secret" || env.JWT_SECRET.length < 32) {
    throw new Error("FATAL: JWT_SECRET must be a strong, unique secret (min 32 characters) in production");
  }
  if (env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1")) {
    throw new Error("FATAL: DATABASE_URL cannot point to localhost in production");
  }
  if (env.PAYMENT_CALLBACK_TOKEN === "change_me_callback_token") {
    throw new Error("FATAL: PAYMENT_CALLBACK_TOKEN must be changed in production");
  }
}

export default env;
