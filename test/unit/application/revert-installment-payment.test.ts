import { describe, expect, it } from "vitest";
import {
  revertInstallmentPayment,
  type RevertInstallmentPaymentDependencies,
} from "@/server/application/revert-installment-payment";
import { Money } from "@/server/domain/money";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";
import type { InstallmentState } from "@/server/domain/installment";

const paidInTwo: InstallmentState = {
  amount: Money.fromReais(50),
  payments: [
    {
      id: "payment-1",
      amount: Money.fromReais(40),
      paidAt: new Date("2026-10-05"),
      paymentMethod: "pix",
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    },
    {
      id: "payment-2",
      amount: Money.fromReais(10),
      paidAt: new Date("2026-10-20"),
      paymentMethod: "cash",
      receivedByUserId: "user-2",
      registeredByUserId: "user-1",
    },
  ],
};

function createDependencies(
  installment: InstallmentState | null,
  balance: { receivedCents: number; transferredCents: number },
) {
  const removed: string[] = [];
  const balanceRequests: string[] = [];
  const dependencies: RevertInstallmentPaymentDependencies = {
    installmentReader: { findById: () => Promise.resolve(installment) },
    paymentWriter: {
      removePayment(paymentId) {
        removed.push(paymentId);
        return Promise.resolve();
      },
    },
    balanceReader: {
      getAvailableBalance(_campaignId, userId) {
        balanceRequests.push(userId);
        return Promise.resolve(balance);
      },
    },
  };
  return { dependencies, removed, balanceRequests };
}

describe("revertInstallmentPayment", () => {
  it("exclui só o pagamento escolhido e informa quanto passa a faltar", async () => {
    const { dependencies, removed, balanceRequests } = createDependencies(paidInTwo, {
      receivedCents: 1000,
      transferredCents: 0,
    });

    const result = await revertInstallmentPayment(
      dependencies,
      "campaign-1",
      "installment-1",
      "payment-2",
    );

    expect(removed).toEqual(["payment-2"]);
    expect(balanceRequests).toEqual(["user-2"]);
    expect(result.removed.amount.toCents()).toBe(1000);
    expect(result.remaining.toCents()).toBe(1000);
  });

  it("não exclui quando o dinheiro já foi repassado", async () => {
    const { dependencies, removed } = createDependencies(paidInTwo, {
      receivedCents: 1000,
      transferredCents: 1000,
    });

    await expect(
      revertInstallmentPayment(dependencies, "campaign-1", "installment-1", "payment-2"),
    ).rejects.toThrow(FundsAlreadyTransferredError);
    expect(removed).toEqual([]);
  });

  it("rejeita parcela que não existe", async () => {
    const { dependencies } = createDependencies(null, { receivedCents: 0, transferredCents: 0 });

    await expect(
      revertInstallmentPayment(dependencies, "campaign-1", "installment-x", "payment-1"),
    ).rejects.toThrow("Parcela não encontrada");
  });
});
