import type { Money } from "./money";
import {
  assertEntryChangeKeepsBalance,
  FundsAlreadyTransferredError,
} from "./money-entry-correction";
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

export interface InstallmentPaymentCorrection {
  paidAt: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
}

export function correctInstallmentPayment(
  installment: InstallmentState,
  correction: InstallmentPaymentCorrection,
  previousReceiverBalance: Money,
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
  if (correction.paidAt > today) {
    throw new Error("Data de pagamento não pode ser no futuro");
  }
  assertEntryChangeKeepsBalance(
    { amount: installment.amount, receivedByUserId: installment.receivedByUserId },
    { amount: installment.amount, receivedByUserId: correction.receivedByUserId },
    previousReceiverBalance,
  );
  return {
    paidAt: correction.paidAt,
    paidAmount: installment.amount,
    paymentMethod: correction.paymentMethod,
    receivedByUserId: correction.receivedByUserId,
    registeredByUserId: installment.registeredByUserId,
  };
}

export function revertInstallmentPayment(
  installment: InstallmentState,
  availableBalance: Money,
): void {
  if (!installment.paidAt) {
    throw new Error("Parcela ainda não foi paga");
  }
  if (availableBalance.toCents() < installment.amount.toCents()) {
    const message =
      "Não é possível reverter: o valor já foi repassado e reverter deixaria o saldo em mãos negativo. Corrija o repasse primeiro.";
    throw installment.receivedByUserId
      ? new FundsAlreadyTransferredError(message, installment.receivedByUserId)
      : new Error(message);
  }
}
