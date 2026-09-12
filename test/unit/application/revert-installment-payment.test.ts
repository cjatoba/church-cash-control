import { describe, expect, it } from "vitest";
import {
  revertInstallmentPayment,
  type InstallmentReader,
  type InstallmentUnpayRepository,
} from "@/server/application/revert-installment-payment";
import { Money } from "@/server/domain/money";
import type { InstallmentState } from "@/server/domain/installment";

function createDependencies(installment: InstallmentState | null) {
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

  return { installmentReader, installmentRepository, revertedIds };
}

describe("revertInstallmentPayment", () => {
  it("reverte a parcela paga para pendente", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-10"),
    });

    await revertInstallmentPayment(dependencies, "installment-1");

    expect(dependencies.revertedIds).toEqual(["installment-1"]);
  });

  it("rejeita quando a parcela não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(revertInstallmentPayment(dependencies, "installment-1")).rejects.toThrow();
    expect(dependencies.revertedIds).toHaveLength(0);
  });

  it("rejeita quando a parcela ainda não foi paga", async () => {
    const dependencies = createDependencies({ amount: Money.fromReais(100), paidAt: null });

    await expect(revertInstallmentPayment(dependencies, "installment-1")).rejects.toThrow();
    expect(dependencies.revertedIds).toHaveLength(0);
  });
});
