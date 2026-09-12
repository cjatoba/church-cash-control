import { describe, expect, it } from "vitest";
import {
  payInstallment,
  type InstallmentReader,
  type InstallmentRepository,
} from "@/server/application/pay-installment";
import { Money } from "@/server/domain/money";
import type { InstallmentPayment, InstallmentState } from "@/server/domain/installment";

function createDependencies(installment: InstallmentState | null) {
  const paidPayments: ({ installmentId: string } & InstallmentPayment)[] = [];
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

const unpaidInstallment: InstallmentState = {
  amount: Money.fromReais(100),
  paidAt: null,
  paymentMethod: null,
  receivedByUserId: null,
  registeredByUserId: null,
};

describe("payInstallment", () => {
  it("marca a parcela como paga com data, forma de pagamento e recebedor informados", async () => {
    const dependencies = createDependencies(unpaidInstallment);

    await payInstallment(
      dependencies,
      "installment-1",
      new Date("2026-03-01"),
      "pix",
      "user-1",
      "user-1",
      new Date("2026-03-10"),
    );

    expect(dependencies.paidPayments).toEqual([
      {
        installmentId: "installment-1",
        paidAt: new Date("2026-03-01"),
        paidAmount: Money.fromReais(100),
        paymentMethod: "pix",
        receivedByUserId: "user-1",
        registeredByUserId: "user-1",
      },
    ]);
  });

  it("mantém quem de fato registrou quando o recebedor é outra pessoa", async () => {
    const dependencies = createDependencies(unpaidInstallment);

    await payInstallment(
      dependencies,
      "installment-1",
      new Date("2026-03-01"),
      "cash",
      "user-2",
      "user-1",
      new Date("2026-03-10"),
    );

    expect(dependencies.paidPayments[0]?.receivedByUserId).toBe("user-2");
    expect(dependencies.paidPayments[0]?.registeredByUserId).toBe("user-1");
  });

  it("rejeita quando a parcela não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      payInstallment(
        dependencies,
        "installment-1",
        new Date("2026-03-10"),
        "pix",
        "user-1",
        "user-1",
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.paidPayments).toHaveLength(0);
  });

  it("rejeita quando a parcela já está paga", async () => {
    const dependencies = createDependencies({
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-01"),
      paymentMethod: "pix",
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    });

    await expect(
      payInstallment(
        dependencies,
        "installment-1",
        new Date("2026-03-10"),
        "pix",
        "user-1",
        "user-1",
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.paidPayments).toHaveLength(0);
  });

  it("rejeita data de pagamento no futuro", async () => {
    const dependencies = createDependencies(unpaidInstallment);

    await expect(
      payInstallment(
        dependencies,
        "installment-1",
        new Date("2026-03-11"),
        "pix",
        "user-1",
        "user-1",
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.paidPayments).toHaveLength(0);
  });
});
