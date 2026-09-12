import { z } from "zod";
import { Money } from "./money";
import { parsePaymentMethod, type PaymentMethod } from "./payment-method";

const oneOffDonationInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  donorName: z.string().trim().optional(),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  receivedByUserId: z.string().trim().min(1, "Recebido por é obrigatório"),
});

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
  return {
    campaignId: data.campaignId,
    donorName: data.donorName && data.donorName.length > 0 ? data.donorName : null,
    amount: Money.fromReais(data.amount),
    date: data.date,
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    receivedByUserId: data.receivedByUserId,
    registeredByUserId,
  };
}
