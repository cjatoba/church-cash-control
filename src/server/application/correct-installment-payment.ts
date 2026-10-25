import { z } from "zod";
import { calculateAvailableBalance } from "../domain/custody-transfer";
import {
  correctInstallmentPayment as computeCorrection,
  type InstallmentPayment,
  type InstallmentState,
} from "../domain/installment";
import { parsePaymentMethod } from "../domain/payment-method";
import type { CustodyBalanceReader } from "./create-custody-transfer";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentRepository {
  markAsPaid(installmentId: string, payment: InstallmentPayment): Promise<void>;
}

export interface CorrectInstallmentPaymentDependencies {
  installmentReader: InstallmentReader;
  installmentRepository: InstallmentRepository;
  balanceReader: CustodyBalanceReader;
}

const correctionSchema = z.object({
  paidAt: z.coerce.date(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  receivedByUserId: z.string().trim().min(1, "Recebido por é obrigatório"),
});

export async function correctInstallmentPayment(
  dependencies: CorrectInstallmentPaymentDependencies,
  campaignId: string,
  installmentId: string,
  input: unknown,
  today: Date = new Date(),
): Promise<{ before: InstallmentState; after: InstallmentPayment }> {
  const data = correctionSchema.parse(input);
  const correction = {
    paidAt: data.paidAt,
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    receivedByUserId: data.receivedByUserId,
  };

  const installment = await dependencies.installmentReader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }

  const totals = installment.receivedByUserId
    ? await dependencies.balanceReader.getAvailableBalance(campaignId, installment.receivedByUserId)
    : { receivedCents: 0, transferredCents: 0 };
  const payment = computeCorrection(
    installment,
    correction,
    calculateAvailableBalance(totals.receivedCents, totals.transferredCents),
    today,
  );

  await dependencies.installmentRepository.markAsPaid(installmentId, payment);
  return { before: installment, after: payment };
}
