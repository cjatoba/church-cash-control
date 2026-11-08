import { z } from "zod";
import {
  payInstallment as computePayment,
  remainingToPay,
  type InstallmentPaymentRecord,
  type InstallmentState,
  type NewInstallmentPayment,
} from "../domain/installment";
import { Money } from "../domain/money";
import { parsePaymentMethod } from "../domain/payment-method";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentPaymentWriter {
  addPayment(installmentId: string, payment: NewInstallmentPayment): Promise<void>;
  updatePayment(payment: InstallmentPaymentRecord): Promise<void>;
  removePayment(paymentId: string): Promise<void>;
}

export const installmentPaymentInputSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  paidAt: z.coerce.date(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  receivedByUserId: z.string().trim().min(1, "Recebido por é obrigatório"),
});

export function parseInstallmentPaymentInput(input: unknown) {
  const data = installmentPaymentInputSchema.parse(input);
  return {
    amount: Money.fromReais(data.amount),
    paidAt: data.paidAt,
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    receivedByUserId: data.receivedByUserId,
  };
}

export async function findInstallmentOrFail(
  reader: InstallmentReader,
  installmentId: string,
): Promise<InstallmentState> {
  const installment = await reader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }
  return installment;
}

export interface PayInstallmentDependencies {
  installmentReader: InstallmentReader;
  paymentWriter: Pick<InstallmentPaymentWriter, "addPayment">;
}

export async function payInstallment(
  dependencies: PayInstallmentDependencies,
  installmentId: string,
  input: unknown,
  registeredByUserId: string,
  today: Date = new Date(),
): Promise<{ payment: NewInstallmentPayment; remaining: Money }> {
  const data = parseInstallmentPaymentInput(input);
  const installment = await findInstallmentOrFail(dependencies.installmentReader, installmentId);

  const payment = computePayment(installment, { ...data, registeredByUserId }, today);
  await dependencies.paymentWriter.addPayment(installmentId, payment);
  return { payment, remaining: remainingToPay(installment).subtract(payment.amount) };
}
