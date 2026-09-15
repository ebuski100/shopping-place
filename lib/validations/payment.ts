import { z } from "zod";

export const initializePaymentSchema = z.object({
  orderId: z.coerce
    .number()
    .int("Order ID must be an integer")
    .positive("Order ID must be positive"),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
