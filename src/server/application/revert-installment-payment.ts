import { revertInstallmentPayment as assertCanRevert } from "../domain/installment";
import type { InstallmentState } from "../domain/installment";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentUnpayRepository {
  markAsUnpaid(installmentId: string): Promise<void>;
}

export interface RevertInstallmentPaymentDependencies {
  installmentReader: InstallmentReader;
  installmentRepository: InstallmentUnpayRepository;
}

export async function revertInstallmentPayment(
  dependencies: RevertInstallmentPaymentDependencies,
  installmentId: string,
): Promise<void> {
  const installment = await dependencies.installmentReader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }

  assertCanRevert(installment);
  await dependencies.installmentRepository.markAsUnpaid(installmentId);
}
