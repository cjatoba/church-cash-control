import { z } from "zod";
import { Money } from "./money";
import { parsePaymentMethod, type PaymentMethod } from "./payment-method";

const loosePledgeInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  donorId: z.string().trim().min(1, "Doador é obrigatório"),
});

export interface LoosePledgeInput {
  campaignId: string;
  donorId: string;
}

export function parseLoosePledgeInput(input: unknown): LoosePledgeInput {
  return loosePledgeInputSchema.parse(input);
}

export type LoosePledgeStatus = "open" | "closed";

export interface LoosePledgeState {
  status: LoosePledgeStatus;
}

const contributionInputSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  receivedByUserId: z.string().trim().min(1, "Recebido por é obrigatório"),
});

export interface LoosePledgeContribution {
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
  registeredByUserId: string;
}

export function addLoosePledgeContribution(
  pledge: LoosePledgeState,
  input: unknown,
  registeredByUserId: string,
): LoosePledgeContribution {
  if (pledge.status === "closed") {
    throw new Error("Carnê avulso encerrado — reabra para registrar uma nova contribuição");
  }

  const data = contributionInputSchema.parse(input);
  return {
    amount: Money.fromReais(data.amount),
    date: data.date,
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    receivedByUserId: data.receivedByUserId,
    registeredByUserId,
  };
}

export interface LoosePledgeSummary {
  id: string;
  donorId: string;
  donorName: string;
  status: LoosePledgeStatus;
  totalContributed: Money;
}

export interface LoosePledgeContributionDetail {
  id: string;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod;
  receivedByLabel: string;
  registeredByLabel: string;
}

export interface LoosePledgeDetail {
  id: string;
  donorName: string;
  status: LoosePledgeStatus;
  contributions: LoosePledgeContributionDetail[];
}
