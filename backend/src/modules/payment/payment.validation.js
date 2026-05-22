import { z } from "zod";

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

const legacyCallbackBodySchema = z.object({
  externalReference: z.string().min(3),
  status: z.enum(["SUCCESS", "FAILED"]),
  providerReference: z.string().optional(),
  reason: z.string().optional(),
  signature: z.string().optional()
});

const paystackCallbackBodySchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        reference: z.string().min(3),
        status: z.string().optional(),
        id: z.union([z.string(), z.number()]).optional(),
        gateway_response: z.string().optional()
      })
      .passthrough()
  })
  .passthrough();

function normalizeCallbackPayload(payload) {
  if (Object.prototype.hasOwnProperty.call(payload, "externalReference")) {
    return payload;
  }

  const providerReference =
    payload.data.id === undefined || payload.data.id === null
      ? undefined
      : String(payload.data.id);
  const success = payload.event === "charge.success" || payload.data.status === "success";

  return {
    externalReference: payload.data.reference,
    status: success ? "SUCCESS" : "FAILED",
    providerReference,
    reason: success ? undefined : payload.data.gateway_response || payload.event
  };
}

const callbackSchema = z.object({
  body: z.union([legacyCallbackBodySchema, paystackCallbackBodySchema]).transform(normalizeCallbackPayload)
});

export { initiatePaymentSchema, callbackSchema };
