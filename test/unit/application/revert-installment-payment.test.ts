import { describe, expect, it } from "vitest";
import {
  revertInstallmentPayment,
  type InstallmentReader,
  type InstallmentUnpayRepository,
  type RevertBalanceReader,
} from "@/server/application/revert-installment-payment";
import { Money } from "@/server/domain/money";
import type { InstallmentState } from "@/server/domain/installment";

function createDependencies(
  installment: InstallmentState | null,
  balanceTotals: { receivedCents: number; transferredCents: number } = {
    receivedCents: 10_000,
    transferredCents: 0,
  },
) {
  const revertedIds: string[] = [];
  const installmentReader: InstallmentReader = {
    findById() {
      return Promise.resolve(installment);
    },
  };
  const installmentRepository: InstallmentUnpayRepository = {
    markAsUnpaid(installmentId) {
      revertedIds.push(installmentId);
      return Promise.resolve();
    },
  };
  const balanceReader: RevertBalanceReader = {
    getAvailableBalance() {
      return Promise.resolve(balanceTotals);
    },
  };

  return { installmentReader, installmentRepository, balanceReader, revertedIds };
}

describe("revertInstallmentPayment", () => {
  it("reverte a parcela paga para pendente quando o saldo em mãos cobre o valor", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-10"),
      paymentMethod: "pix",
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    });

    await revertInstallmentPayment(dependencies, "campaign-1", "installment-1");

    expect(dependencies.revertedIds).toEqual(["installment-1"]);
  });

  it("rejeita quando a parcela não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      revertInstallmentPayment(dependencies, "campaign-1", "installment-1"),
    ).rejects.toThrow();
    expect(dependencies.revertedIds).toHaveLength(0);
  });

  it("rejeita quando a parcela ainda não foi paga", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: null,
      paymentMethod: null,
      receivedByUserId: null,
      registeredByUserId: null,
    });

    await expect(
      revertInstallmentPayment(dependencies, "campaign-1", "installment-1"),
    ).rejects.toThrow();
    expect(dependencies.revertedIds).toHaveLength(0);
  });

  it("rejeita quando o valor recebido já foi repassado, evitando saldo negativo", async () => {
    const dependencies = createDependencies(
      {
        amount: Money.fromReais(100),
        paidAt: new Date("2026-03-10"),
        paymentMethod: "pix",
        receivedByUserId: "user-1",
        registeredByUserId: "user-1",
      },
      { receivedCents: 10_000, transferredCents: 9_970 },
    );

    await expect(
      revertInstallmentPayment(dependencies, "campaign-1", "installment-1"),
    ).rejects.toThrow();
    expect(dependencies.revertedIds).toHaveLength(0);
  });
});
