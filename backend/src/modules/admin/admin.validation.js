const { z } = require("zod");

const manualRefundSchema = z.object({
  body: z.object({
    transactionId: z.string().uuid(),
    reason: z.string().min(3)
  })
});

module.exports = {
  manualRefundSchema
};
