import type { Money } from "./money";
import type { PaymentMethod } from "./payment-method";

export interface InstallmentState {
  amount: Money;
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  receivedByUserId: string | null;
  registeredByUserId: string | null;
}

export interface InstallmentPayment {
  paidAt: Date;
  paidAmount: Money;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
  registeredByUserId: string;
}

export function payInstallment(
  installment: InstallmentState,
  paidAt: Date,
  paymentMethod: PaymentMethod,
  receivedByUserId: string,
  registeredByUserId: string,
  today: Date = new Date(),
): InstallmentPayment {
  if (installment.paidAt) {
    throw new Error("Parcela já está paga");
  }
  if (paidAt > today) {
    throw new Error("Data de pagamento não pode ser no futuro");
  }
  return {
    paidAt,
    paidAmount: installment.amount,
    paymentMethod,
    receivedByUserId,
    registeredByUserId,
  };
}

export function correctInstallmentPaymentDate(
  installment: InstallmentState,
  paidAt: Date,
  today: Date = new Date(),
): InstallmentPayment {
  if (
    !installment.paidAt ||
    !installment.paymentMethod ||
    !installment.receivedByUserId ||
    !installment.registeredByUserId
  ) {
    throw new Error("Parcela ainda não foi paga");
  }
  if (paidAt > today) {
    throw new Error("Data de pagamento não pode ser no futuro");
  }
  return {
    paidAt,
    paidAmount: installment.amount,
    paymentMethod: installment.paymentMethod,
    receivedByUserId: installment.receivedByUserId,
    registeredByUserId: installment.registeredByUserId,
  };
}

export function revertInstallmentPayment(installment: InstallmentState): void {
  if (!installment.paidAt) {
    throw new Error("Parcela ainda não foi paga");
  }
}
