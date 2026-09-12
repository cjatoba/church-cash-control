import { z } from "zod";

export const paymentMethods = ["pix", "cash"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

const paymentMethodSchema = z.enum(paymentMethods);

export function parsePaymentMethod(input: unknown): PaymentMethod {
  return paymentMethodSchema.parse(input);
}
