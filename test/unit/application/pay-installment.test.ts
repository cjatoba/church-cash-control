import { describe, expect, it } from "vitest";
import {
  payInstallment,
  type InstallmentReader,
  type InstallmentRepository,
} from "@/server/application/pay-installment";
import { Money } from "@/server/domain/money";
import type { InstallmentState } from "@/server/domain/installment";

function createDependencies(installment: InstallmentState | null) {
  const paidPayments: { installmentId: string; paidAt: Date; paidAmount: Money }[] = [];
  const installmentReader: InstallmentReader = {
    findById() {
      return Promise.resolve(installment);
    },
  };
  const installmentRepository: InstallmentRepository = {
    markAsPaid(installmentId, payment) {
      paidPayments.push({ installmentId, ...payment });
      return Promise.resolve();
    },
  };

  return { installmentReader, installmentRepository, paidPayments };
}

describe("payInstallment", () => {
  it("marca a parcela como paga com a data e o valor da parcela", async () => {
    const dependencies = createDependencies({ amount: Money.fromReais(100), paidAt: null });

    await payInstallment(dependencies, "installment-1", new Date("2026-03-10"));

    expect(dependencies.paidPayments).toEqual([
      {
        installmentId: "installment-1",
        paidAt: new Date("2026-03-10"),
        paidAmount: Money.fromReais(100),
      },
    ]);
  });

  it("rejeita quando a parcela não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      payInstallment(dependencies, "installment-1", new Date("2026-03-10")),
    ).rejects.toThrow();
    expect(dependencies.paidPayments).toHaveLength(0);
  });

  it("rejeita quando a parcela já está paga", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-01"),
    });

    await expect(
      payInstallment(dependencies, "installment-1", new Date("2026-03-10")),
    ).rejects.toThrow();
    expect(dependencies.paidPayments).toHaveLength(0);
  });
});
