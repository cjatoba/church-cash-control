import { calculateAvailableBalance } from "../domain/custody-transfer";
import {
  correctInstallmentPayment as computeCorrection,
  findInstallmentPayment,
  remainingToPay,
  type InstallmentPaymentRecord,
} from "../domain/installment";
import type { Money } from "../domain/money";
import type { CustodyBalanceReader } from "./create-custody-transfer";
import {
  findInstallmentOrFail,
  parseInstallmentPaymentInput,
  type InstallmentPaymentWriter,
  type InstallmentReader,
} from "./pay-installment";

export interface CorrectInstallmentPaymentDependencies {
  installmentReader: InstallmentReader;
  paymentWriter: Pick<InstallmentPaymentWriter, "updatePayment">;
  balanceReader: CustodyBalanceReader;
}

export async function correctInstallmentPayment(
  dependencies: CorrectInstallmentPaymentDependencies,
  campaignId: string,
  installmentId: string,
  paymentId: string,
  input: unknown,
  today: Date = new Date(),
): Promise<{
  before: InstallmentPaymentRecord;
  after: InstallmentPaymentRecord;
  remaining: Money;
}> {
  const correction = parseInstallmentPaymentInput(input);
  const installment = await findInstallmentOrFail(dependencies.installmentReader, installmentId);
  const before = findInstallmentPayment(installment, paymentId);

  const totals = before.receivedByUserId
    ? await dependencies.balanceReader.getAvailableBalance(campaignId, before.receivedByUserId)
    : { receivedCents: 0, transferredCents: 0 };
  const after = computeCorrection(
    installment,
    paymentId,
    correction,
    calculateAvailableBalance(totals.receivedCents, totals.transferredCents),
    today,
  );

  await dependencies.paymentWriter.updatePayment(after);
  const payments = installment.payments.map((payment) =>
    payment.id === paymentId ? after : payment,
  );
  return {
    before,
    after,
    remaining: remainingToPay({ amount: installment.amount, payments }),
  };
}
