import type { Money } from "./money";

export interface InstallmentState {
  amount: Money;
  paidAt: Date | null;
}

export interface InstallmentPayment {
  paidAt: Date;
  paidAmount: Money;
}

export function payInstallment(installment: InstallmentState, now: Date): InstallmentPayment {
  if (installment.paidAt) {
    throw new Error("Parcela já está paga");
  }
  return { paidAt: now, paidAmount: installment.amount };
}
