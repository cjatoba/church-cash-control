import { revertInstallmentPayment as assertCanRevert } from "../domain/installment";
import { calculateAvailableBalance } from "../domain/custody-transfer";
import type { InstallmentState } from "../domain/installment";

export interface InstallmentReader {
  findById(installmentId: string): Promise<InstallmentState | null>;
}

export interface InstallmentUnpayRepository {
  markAsUnpaid(installmentId: string): Promise<void>;
}

export interface RevertBalanceReader {
  getAvailableBalance(
    campaignId: string,
    userId: string,
  ): Promise<{ receivedCents: number; transferredCents: number }>;
}

export interface RevertInstallmentPaymentDependencies {
  installmentReader: InstallmentReader;
  installmentRepository: InstallmentUnpayRepository;
  balanceReader: RevertBalanceReader;
}

export async function revertInstallmentPayment(
  dependencies: RevertInstallmentPaymentDependencies,
  campaignId: string,
  installmentId: string,
): Promise<void> {
  const installment = await dependencies.installmentReader.findById(installmentId);
  if (!installment) {
    throw new Error("Parcela não encontrada");
  }

  const totals = installment.receivedByUserId
    ? await dependencies.balanceReader.getAvailableBalance(campaignId, installment.receivedByUserId)
    : { receivedCents: 0, transferredCents: 0 };
  const availableBalance = calculateAvailableBalance(totals.receivedCents, totals.transferredCents);

  assertCanRevert(installment, availableBalance);
  await dependencies.installmentRepository.markAsUnpaid(installmentId);
}
