import { z } from "zod";
import { Money } from "./money";

const pledgeTypeInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  name: z.string().trim().min(1, "Nome do tipo de carnê é obrigatório"),
  installmentValue: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive("Valor da parcela deve ser maior que zero").optional(),
  ),
});

export interface PledgeType {
  campaignId: string;
  name: string;
  installmentValue: Money | null;
}

export interface PledgeTypeSummary extends PledgeType {
  id: string;
}

export function parsePledgeType(input: unknown): PledgeType {
  const data = pledgeTypeInputSchema.parse(input);
  return {
    campaignId: data.campaignId,
    name: data.name,
    installmentValue:
      data.installmentValue === undefined ? null : Money.fromReais(data.installmentValue),
  };
}
