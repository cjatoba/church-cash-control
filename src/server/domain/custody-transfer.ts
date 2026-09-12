import { z } from "zod";
import { Money } from "./money";

const custodyTransferInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  fromUserId: z.string().trim().min(1, "Quem está repassando é obrigatório"),
  recipientName: z.string().trim().min(1, "Destinatário é obrigatório"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  transferDate: z.coerce.date(),
  description: z.string().trim().optional(),
});

export interface CustodyTransferInput {
  campaignId: string;
  fromUserId: string;
  recipientName: string;
  amount: Money;
  transferDate: Date;
  description: string | null;
}

export function parseCustodyTransferInput(input: unknown): CustodyTransferInput {
  const data = custodyTransferInputSchema.parse(input);
  return {
    campaignId: data.campaignId,
    fromUserId: data.fromUserId,
    recipientName: data.recipientName,
    amount: Money.fromReais(data.amount),
    transferDate: data.transferDate,
    description: data.description && data.description.length > 0 ? data.description : null,
  };
}

/**
 * Saldo em mãos = total recebido pela pessoa menos o que ela já repassou.
 */
export function calculateAvailableBalance(receivedCents: number, transferredCents: number): Money {
  return Money.fromCents(receivedCents - transferredCents);
}

export function assertTransferWithinBalance(
  amount: Money,
  availableBalance: Money,
  transferDate: Date,
  today: Date = new Date(),
): void {
  if (amount.toCents() > availableBalance.toCents()) {
    throw new Error("Valor do repasse maior que o saldo disponível");
  }
  if (transferDate > today) {
    throw new Error("Data do repasse não pode ser no futuro");
  }
}
