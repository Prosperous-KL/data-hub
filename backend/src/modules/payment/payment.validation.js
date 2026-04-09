const { z } = require("zod");

const initiatePaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    momoNumber: z.string().min(8),
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
