import { z } from "zod";

const manualRefundSchema = z.object({
  body: z.object({
    transactionId: z.string().uuid(),
    reason: z.string().min(3)
  })
});

export { manualRefundSchema };
