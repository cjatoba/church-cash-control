import { correctInstallmentPaymentDate as computeCorrection } from "../domain/installment";
import type { InstallmentPayment, InstallmentState } from "../domain/installment";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentRepository {
  markAsPaid(installmentId: string, payment: InstallmentPayment): Promise<void>;
}

export interface CorrectInstallmentPaymentDateDependencies {
  installmentReader: InstallmentReader;
  installmentRepository: InstallmentRepository;
}

export async function correctInstallmentPaymentDate(
  dependencies: CorrectInstallmentPaymentDateDependencies,
  installmentId: string,
  paidAt: Date,
  today: Date = new Date(),
): Promise<void> {
  const installment = await dependencies.installmentReader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }

  const payment = computeCorrection(installment, paidAt, today);
  await dependencies.installmentRepository.markAsPaid(installmentId, payment);
}
