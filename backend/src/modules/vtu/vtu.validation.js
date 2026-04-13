const { z } = require("zod");
const { NETWORKS } = require("../../utils/constants");
const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function normalizePhoneInput(value) {
  return String(value || "").replace(/[\s-]/g, "").trim();
}

function isValidGhanaPhone(value) {
  return ghPhoneRegex.test(normalizePhoneInput(value));
}

const buyDataSchema = z.object({
  body: z.object({
    network: z.enum(NETWORKS),
    bundleCode: z.string().min(2),
    phoneNumber: z.string().refine(isValidGhanaPhone, "Phone number must be a valid Ghana number")
  })
});

module.exports = {
  buyDataSchema
};
