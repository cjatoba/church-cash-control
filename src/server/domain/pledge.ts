import { z } from "zod";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment-method";

const pledgeInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  donorId: z.string().trim().min(1, "Doador é obrigatório"),
  pledgeTypeId: z.string().trim().min(1, "Tipo de carnê é obrigatório"),
  installmentCount: z.coerce
    .number()
    .int()
    .positive("Quantidade de parcelas deve ser maior que zero")
    .optional(),
});

export interface PledgeInput {
  campaignId: string;
  donorId: string;
  pledgeTypeId: string;
  installmentCount?: number;
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
 * Quantidade de meses (parcelas) entre o início e o fim da campanha, ambos
 * inclusos — teto usado tanto para gerar o carnê automático quanto para
 * validar uma quantidade customizada de parcelas.
 */
export function countRemainingInstallments(startDate: Date, campaignEndDate: Date): number {
  const cursor = firstDayOfMonth(startDate);
  const end = firstDayOfMonth(campaignEndDate);

  let count = 0;
  while (cursor <= end) {
    count += 1;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return count;
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
  const count = countRemainingInstallments(params.startDate, params.campaignEndDate);
  const cursor = firstDayOfMonth(params.startDate);

  const installments: Installment[] = [];
  for (let i = 0; i < count; i += 1) {
    installments.push({ dueDate: new Date(cursor), amount: installmentValue });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return installments;
}

/**
 * Quando o doador escolhe uma quantidade customizada de parcelas (em vez
 * de ir até o fim da campanha), ela nunca pode ultrapassar o total já
 * gerado por generateInstallments — esse total é o teto (fim da
 * campanha), a mesma regra que já vale para o carnê automático.
 */
export function selectFirstInstallments(installments: Installment[], count: number): Installment[] {
  if (count < 1 || count > installments.length) {
    throw new Error(`Quantidade de parcelas deve estar entre 1 e ${String(installments.length)}`);
  }
  return installments.slice(0, count);
}

export interface PledgeSummary {
  id: string;
  donorId: string;
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
