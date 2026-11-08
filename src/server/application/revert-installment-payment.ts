import { calculateAvailableBalance } from "../domain/custody-transfer";
import {
  findInstallmentPayment,
  remainingToPay,
  removeInstallmentPayment,
  type InstallmentPaymentRecord,
} from "../domain/installment";
import type { Money } from "../domain/money";
import type { CustodyBalanceReader } from "./create-custody-transfer";
import {
  findInstallmentOrFail,
  type InstallmentPaymentWriter,
  type InstallmentReader,
} from "./pay-installment";

export interface RevertInstallmentPaymentDependencies {
  installmentReader: InstallmentReader;
  paymentWriter: Pick<InstallmentPaymentWriter, "removePayment">;
  balanceReader: CustodyBalanceReader;
}

export async function revertInstallmentPayment(
  dependencies: RevertInstallmentPaymentDependencies,
  campaignId: string,
  installmentId: string,
  paymentId: string,
): Promise<{ removed: InstallmentPaymentRecord; remaining: Money }> {
  const installment = await findInstallmentOrFail(dependencies.installmentReader, installmentId);
  const payment = findInstallmentPayment(installment, paymentId);

  const totals = payment.receivedByUserId
    ? await dependencies.balanceReader.getAvailableBalance(campaignId, payment.receivedByUserId)
    : { receivedCents: 0, transferredCents: 0 };
  removeInstallmentPayment(
    installment,
    paymentId,
    calculateAvailableBalance(totals.receivedCents, totals.transferredCents),
  );

  await dependencies.paymentWriter.removePayment(paymentId);
  const payments = installment.payments.filter((candidate) => candidate.id !== paymentId);
  return {
    removed: payment,
    remaining: remainingToPay({ amount: installment.amount, payments }),
  };
}
