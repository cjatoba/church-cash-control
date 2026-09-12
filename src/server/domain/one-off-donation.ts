import { z } from "zod";
import { Money } from "./money";

const oneOffDonationInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  donorName: z.string().trim().optional(),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
});

export interface OneOffDonation {
  campaignId: string;
  donorName: string | null;
  amount: Money;
  date: Date;
}

export function parseOneOffDonation(input: unknown): OneOffDonation {
  const data = oneOffDonationInputSchema.parse(input);
  return {
    campaignId: data.campaignId,
    donorName: data.donorName && data.donorName.length > 0 ? data.donorName : null,
    amount: Money.fromReais(data.amount),
    date: data.date,
  };
}
