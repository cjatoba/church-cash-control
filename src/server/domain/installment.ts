import type { Money } from "./money";

export interface InstallmentState {
  amount: Money;
  paidAt: Date | null;
}

export interface InstallmentPayment {
  paidAt: Date;
  paidAmount: Money;
}

export function payInstallment(
  installment: InstallmentState,
  paidAt: Date,
  today: Date = new Date(),
): InstallmentPayment {
  if (installment.paidAt) {
    throw new Error("Parcela já está paga");
  }
  if (paidAt > today) {
    throw new Error("Data de pagamento não pode ser no futuro");
  }
  return { paidAt, paidAmount: installment.amount };
}
