import { z } from "zod";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment-method";

const pledgeInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  donorId: z.string().trim().min(1, "Doador é obrigatório"),
  pledgeTypeId: z.string().trim().min(1, "Tipo de carnê é obrigatório"),
});

export interface PledgeInput {
  campaignId: string;
  donorId: string;
  pledgeTypeId: string;
}

export function parsePledgeInput(input: unknown): PledgeInput {
  return pledgeInputSchema.parse(input);
}

export interface Installment {
  dueDate: Date;
  amount: Money;
}

export interface Pledge {
  campaignId: string;
  donorId: string;
  pledgeTypeId: string;
  installments: Installment[];
}

function firstDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Uma parcela é gerada por mês entre o início e o fim da campanha (ambos
 * inclusos) — o carnê acompanha o período da campanha em vez de ter uma
 * quantidade de parcelas configurada à parte.
 */
export function generateInstallments(params: {
  startDate: Date;
  campaignEndDate: Date;
  installmentValue: Money;
}): Installment[] {
  const { installmentValue } = params;
  const cursor = firstDayOfMonth(params.startDate);
  const end = firstDayOfMonth(params.campaignEndDate);

  const installments: Installment[] = [];
  while (cursor <= end) {
    installments.push({ dueDate: new Date(cursor), amount: installmentValue });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return installments;
}

export interface PledgeSummary {
  id: string;
  donorName: string;
  pledgeTypeName: string;
  installmentValue: Money;
  totalInstallments: number;
  paidInstallments: number;
}

export function isPledgeClosed(pledge: PledgeSummary): boolean {
  return pledge.totalInstallments > 0 && pledge.paidInstallments === pledge.totalInstallments;
}

export interface InstallmentDetail {
  id: string;
  dueDate: Date;
  amount: Money;
  paidAt: Date | null;
  paidAmount: Money | null;
  paymentMethod: PaymentMethod | null;
  receivedByLabel: string | null;
  registeredByLabel: string | null;
}

export interface PledgeDetail {
  id: string;
  donorName: string;
  pledgeTypeName: string;
  installmentValue: Money;
  installments: InstallmentDetail[];
}

export interface PendingInstallmentCandidate {
  id: string;
  dueDate: Date;
  paidAt: Date | null;
}

/**
 * Ao encurtar o período de uma campanha, as parcelas ainda não pagas que
 * caíam fora do novo fim devem ser removidas — parcelas pagas nunca são
 * removidas, pois são histórico financeiro.
 */
export function selectInstallmentsOutsidePeriod(
  installments: PendingInstallmentCandidate[],
  campaignEndDate: Date,
): string[] {
  const end = firstDayOfMonth(campaignEndDate);
  return installments
    .filter((installment) => !installment.paidAt && installment.dueDate > end)
    .map((installment) => installment.id);
}
