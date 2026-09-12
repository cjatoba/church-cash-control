import { describe, expect, it } from "vitest";
import {
  correctInstallmentPaymentDate,
  type InstallmentReader,
  type InstallmentRepository,
} from "@/server/application/correct-installment-payment-date";
import { Money } from "@/server/domain/money";
import type { InstallmentState } from "@/server/domain/installment";

function createDependencies(installment: InstallmentState | null) {
  const updatedPayments: { installmentId: string; paidAt: Date; paidAmount: Money }[] = [];
  const installmentReader: InstallmentReader = {
    findById() {
      return Promise.resolve(installment);
    },
  };
  const installmentRepository: InstallmentRepository = {
    markAsPaid(installmentId, payment) {
      updatedPayments.push({ installmentId, ...payment });
      return Promise.resolve();
    },
  };

  return { installmentReader, installmentRepository, updatedPayments };
}

describe("correctInstallmentPaymentDate", () => {
  it("corrige a data de pagamento mantendo valor, forma de pagamento e recebedor", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-10"),
      paymentMethod: "pix",
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    });

    await correctInstallmentPaymentDate(
      dependencies,
      "installment-1",
      new Date("2026-03-05"),
      new Date("2026-03-10"),
    );

    expect(dependencies.updatedPayments).toEqual([
      {
        installmentId: "installment-1",
        paidAt: new Date("2026-03-05"),
        paidAmount: Money.fromReais(100),
        paymentMethod: "pix",
        receivedByUserId: "user-1",
        registeredByUserId: "user-1",
      },
    ]);
  });

  it("rejeita quando a parcela não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      correctInstallmentPaymentDate(
        dependencies,
        "installment-1",
        new Date("2026-03-05"),
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.updatedPayments).toHaveLength(0);
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
      correctInstallmentPaymentDate(
        dependencies,
        "installment-1",
        new Date("2026-03-05"),
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.updatedPayments).toHaveLength(0);
  });

  it("rejeita nova data de pagamento no futuro", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-10"),
      paymentMethod: "pix",
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    });

    await expect(
      correctInstallmentPaymentDate(
        dependencies,
        "installment-1",
        new Date("2026-03-11"),
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.updatedPayments).toHaveLength(0);
  });
});
