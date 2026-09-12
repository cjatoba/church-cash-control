import { z } from "zod";

const donorInputSchema = z.object({
  name: z.string().trim().min(1, "Nome do doador é obrigatório"),
});

export interface Donor {
  name: string;
}

export function parseDonor(input: unknown): Donor {
  return donorInputSchema.parse(input);
}
