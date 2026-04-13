const { z } = require("zod");

const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function normalizePhoneInput(value) {
  return String(value || "").replace(/[\s-]/g, "").trim();
}

function isValidGhanaPhone(value) {
  return ghPhoneRegex.test(normalizePhoneInput(value));
}

const initiatePaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    momoNumber: z.string().refine(isValidGhanaPhone, "MoMo number must be a valid Ghana phone number"),
    provider: z.enum(["MTN", "TELECEL", "AIRTELTIGO"])
  })
});

const callbackSchema = z.object({
  body: z.object({
    externalReference: z.string().min(3),
    status: z.enum(["SUCCESS", "FAILED"]),
    providerReference: z.string().optional(),
    reason: z.string().optional(),
    signature: z.string().optional()
  })
});

module.exports = {
  initiatePaymentSchema,
  callbackSchema
};
