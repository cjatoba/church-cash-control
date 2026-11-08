import { Money } from "./money";
import { assertEntryChangeKeepsBalance } from "./money-entry-correction";
import type { PaymentMethod } from "./payment-method";

// Forma e quem recebeu/registrou podem faltar só em pagamentos antigos,
// registrados antes de o app guardar essas informações.
export interface InstallmentPaymentRecord {
  id: string;
  amount: Money;
  paidAt: Date;
  paymentMethod: PaymentMethod | null;
  receivedByUserId: string | null;
  registeredByUserId: string | null;
}

export interface InstallmentState {
  amount: Money;
  payments: InstallmentPaymentRecord[];
}

export interface NewInstallmentPayment {
  amount: Money;
  paidAt: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
  registeredByUserId: string;
}

export interface InstallmentPaymentCorrection {
  amount: Money;
  paidAt: Date;
  paymentMethod: PaymentMethod;
  receivedByUserId: string;
}

// Só valor da parcela e valores pagos importam para a situação dela.
interface InstallmentAmounts {
  amount: Money;
  payments: readonly { amount: Money }[];
}

export function sumPaid(installment: InstallmentAmounts): Money {
  return installment.payments.reduce((sum, payment) => sum.add(payment.amount), Money.fromCents(0));
}

export function remainingToPay(installment: InstallmentAmounts): Money {
  return Money.fromCents(
    Math.max(0, installment.amount.toCents() - sumPaid(installment).toCents()),
  );
}

export function isFullyPaid(installment: InstallmentAmounts): boolean {
  return remainingToPay(installment).toCents() === 0;
}

function assertValidAmount(amount: Money, maximum: Money): void {
  if (amount.toCents() <= 0) {
    throw new Error("Informe um valor maior que zero");
  }
  if (amount.toCents() > maximum.toCents()) {
    throw new Error("O valor passa do que falta pagar nesta parcela");
  }
}

function assertNotInFuture(paidAt: Date, today: Date): void {
  if (paidAt > today) {
    throw new Error("Data de pagamento não pode ser no futuro");
  }
}

export function findInstallmentPayment(
  installment: InstallmentState,
  paymentId: string,
): InstallmentPaymentRecord {
  const payment = installment.payments.find((candidate) => candidate.id === paymentId);
  if (!payment) {
    throw new Error("Pagamento não encontrado");
  }
  return payment;
}

export function payInstallment(
  installment: InstallmentState,
  payment: NewInstallmentPayment,
  today: Date = new Date(),
): NewInstallmentPayment {
  if (isFullyPaid(installment)) {
    throw new Error("Parcela já está paga");
  }
  assertValidAmount(payment.amount, remainingToPay(installment));
  assertNotInFuture(payment.paidAt, today);
  return payment;
}

export function correctInstallmentPayment(
  installment: InstallmentState,
  paymentId: string,
  correction: InstallmentPaymentCorrection,
  previousReceiverBalance: Money,
  today: Date = new Date(),
): InstallmentPaymentRecord {
  const current = findInstallmentPayment(installment, paymentId);
  assertValidAmount(correction.amount, remainingToPay(installment).add(current.amount));
  assertNotInFuture(correction.paidAt, today);
  assertEntryChangeKeepsBalance(
    { amount: current.amount, receivedByUserId: current.receivedByUserId },
    { amount: correction.amount, receivedByUserId: correction.receivedByUserId },
    previousReceiverBalance,
  );
  return { ...current, ...correction };
}

export function removeInstallmentPayment(
  installment: InstallmentState,
  paymentId: string,
  receiverBalance: Money,
): void {
  const payment = findInstallmentPayment(installment, paymentId);
  assertEntryChangeKeepsBalance(
    { amount: payment.amount, receivedByUserId: payment.receivedByUserId },
    null,
    receiverBalance,
  );
}
