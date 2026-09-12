import { payInstallment as computePayment, type InstallmentState } from "../domain/installment";
import type { InstallmentPayment } from "../domain/installment";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentRepository {
  markAsPaid(installmentId: string, payment: InstallmentPayment): Promise<void>;
}

export interface PayInstallmentDependencies {
  installmentReader: InstallmentReader;
  installmentRepository: InstallmentRepository;
}

export async function payInstallment(
  dependencies: PayInstallmentDependencies,
  installmentId: string,
  paidAt: Date = new Date(),
  today: Date = new Date(),
): Promise<void> {
  const installment = await dependencies.installmentReader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }

  const payment = computePayment(installment, paidAt, today);
  await dependencies.installmentRepository.markAsPaid(installmentId, payment);
}
