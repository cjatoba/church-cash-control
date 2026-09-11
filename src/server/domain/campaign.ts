import { z } from "zod";
import { Money } from "./money";

const campaignInputSchema = z
  .object({
    name: z.string().trim().min(1, "Nome da campanha é obrigatório"),
    goal: z.coerce.number().positive("Meta deve ser maior que zero"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Data de término deve ser depois da data de início",
    path: ["endDate"],
  });

export interface Campaign {
  name: string;
  goal: Money;
  startDate: Date;
  endDate: Date;
}

export function parseCampaign(input: unknown): Campaign {
  const data = campaignInputSchema.parse(input);
  return {
    name: data.name,
    goal: Money.fromReais(data.goal),
    startDate: data.startDate,
    endDate: data.endDate,
  };
}
