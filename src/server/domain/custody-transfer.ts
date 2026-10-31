import { z } from "zod";
import { Money } from "./money";
import { FundsAlreadyTransferredError } from "./money-entry-correction";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

// O dinheiro vai para outro voluntário (toUserId, entra no saldo em mãos
// dele) ou sai da equipe (recipientName digitado, ex.: quem vendeu a
// compra) — nunca os dois.
const custodyTransferInputSchema = z
  .object({
    campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
    fromUserId: z.string().trim().min(1, "Quem está repassando é obrigatório"),
    toUserId: optionalText,
    recipientName: optionalText,
    amount: z.coerce.number().positive("Valor deve ser maior que zero"),
    transferDate: z.coerce.date(),
    description: optionalText,
  })
  .superRefine((data, context) => {
    if (data.toUserId === null && data.recipientName === null) {
      context.addIssue({ code: "custom", message: "Destinatário é obrigatório" });
    }
    if (data.toUserId !== null && data.recipientName !== null) {
      context.addIssue({
        code: "custom",
        message: "Escolha um voluntário ou digite um destinatário de fora, não os dois",
      });
    }
  });

export interface CustodyTransferInput {
  campaignId: string;
  fromUserId: string;
  toUserId: string | null;
  recipientName: string | null;
  amount: Money;
  transferDate: Date;
  description: string | null;
}

export function parseCustodyTransferInput(input: unknown): CustodyTransferInput {
  const data = custodyTransferInputSchema.parse(input);
  if (data.toUserId === data.fromUserId) {
    throw new Error("Quem repassa e quem recebe precisam ser pessoas diferentes");
  }
  return {
    campaignId: data.campaignId,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    recipientName: data.recipientName,
    amount: Money.fromReais(data.amount),
    transferDate: data.transferDate,
    description: data.description,
  };
}

/**
 * Saldo em mãos = total recebido pela pessoa menos o que ela já repassou.
 */
export function calculateAvailableBalance(receivedCents: number, transferredCents: number): Money {
  return Money.fromCents(receivedCents - transferredCents);
}

export function assertTransferDateNotInFuture(transferDate: Date, today: Date = new Date()): void {
  if (transferDate > today) {
    throw new Error("Data do repasse não pode ser no futuro");
  }
}

export interface TransferMovement {
  fromUserId: string;
  toUserId: string | null;
  amount: Money;
}

function addDelta(deltas: Map<string, number>, userId: string, cents: number): void {
  deltas.set(userId, (deltas.get(userId) ?? 0) + cents);
}

/**
 * Criar (before = null), corrigir ou excluir (after = null) um repasse move
 * dinheiro entre saldos em mãos: sai de quem repassa e, se for para outro
 * voluntário, entra no saldo dele. Ninguém pode ficar negativo — quem
 * repassa não pode dar mais do que tem, e um voluntário não pode perder um
 * repasse que já passou adiante (aí o repasse dele precisa ser corrigido
 * primeiro).
 */
export function assertTransferChangeKeepsBalances(
  before: TransferMovement | null,
  after: TransferMovement | null,
  balanceOf: (userId: string) => Money,
): void {
  const deltas = new Map<string, number>();
  if (before) {
    addDelta(deltas, before.fromUserId, before.amount.toCents());
    if (before.toUserId) {
      addDelta(deltas, before.toUserId, -before.amount.toCents());
    }
  }
  if (after) {
    addDelta(deltas, after.fromUserId, -after.amount.toCents());
    if (after.toUserId) {
      addDelta(deltas, after.toUserId, after.amount.toCents());
    }
  }

  for (const [userId, deltaCents] of deltas) {
    if (deltaCents >= 0 || balanceOf(userId).toCents() + deltaCents >= 0) {
      continue;
    }
    if (userId === after?.fromUserId) {
      throw new Error("Valor do repasse maior que o saldo disponível");
    }
    throw new FundsAlreadyTransferredError(
      "Não dá para fazer esta correção: quem recebeu este repasse já passou o dinheiro adiante e o saldo em mãos dele ficaria negativo. Corrija o repasse dele primeiro.",
      userId,
    );
  }
}
