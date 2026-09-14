import { z } from "zod";

const donorInputSchema = z.object({
  name: z.string().trim().min(1, "Nome do doador é obrigatório"),
});

export interface Donor {
  name: string;
}

export interface DonorState extends Donor {
  anonymizedAt: Date | null;
}

export const ANONYMIZED_DONOR_NAME = "Doador removido";

export function parseDonor(input: unknown): Donor {
  return donorInputSchema.parse(input);
}

export function updateDonorName(donor: DonorState, input: unknown): Donor {
  if (donor.anonymizedAt) {
    throw new Error("Não é possível editar os dados de um doador removido");
  }
  return parseDonor(input);
}

export function anonymizeDonor(donor: DonorState, now: Date = new Date()): DonorState {
  if (donor.anonymizedAt) {
    throw new Error("Os dados deste doador já foram removidos");
  }
  return { name: ANONYMIZED_DONOR_NAME, anonymizedAt: now };
}
