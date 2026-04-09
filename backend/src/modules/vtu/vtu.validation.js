const { z } = require("zod");
const { NETWORKS } = require("../../utils/constants");

const buyDataSchema = z.object({
  body: z.object({
    network: z.enum(NETWORKS),
    bundleCode: z.string().min(2),
    phoneNumber: z.string().min(8)
  })
});

module.exports = {
  buyDataSchema
};
