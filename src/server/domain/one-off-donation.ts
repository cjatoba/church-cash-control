import { z } from "zod";
import { Money } from "./money";
import { parsePaymentMethod, type PaymentMethod } from "./payment-method";

const oneOffDonationFieldsSchema = z.object({
  donorName: z.string().trim().optional(),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  receivedByUserId: z.string().trim().min(1, "Recebido por é obrigatório"),
});

const oneOffDonationInputSchema = oneOffDonationFieldsSchema.extend({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
});

export interface OneOffDonationCorrection {
  donorName: string | null;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
}

function toFields(data: z.infer<typeof oneOffDonationFieldsSchema>): OneOffDonationCorrection {
  return {
    donorName: data.donorName && data.donorName.length > 0 ? data.donorName : null,
    amount: Money.fromReais(data.amount),
    date: data.date,
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    receivedByUserId: data.receivedByUserId,
  };
}

export function parseOneOffDonationCorrection(input: unknown): OneOffDonationCorrection {
  return toFields(oneOffDonationFieldsSchema.parse(input));
}

export interface OneOffDonation {
  campaignId: string;
  donorName: string | null;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
  registeredByUserId: string;
}

export function parseOneOffDonation(input: unknown, registeredByUserId: string): OneOffDonation {
  const data = oneOffDonationInputSchema.parse(input);
  return { campaignId: data.campaignId, ...toFields(data), registeredByUserId };
}

export interface OneOffDonationSummary {
  id: string;
  donorName: string | null;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod | null;
}
