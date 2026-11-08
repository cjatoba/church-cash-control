import { describe, expect, it } from "vitest";
import {
  payInstallment,
  type InstallmentPaymentWriter,
  type InstallmentReader,
} from "@/server/application/pay-installment";
import { Money } from "@/server/domain/money";
import type { InstallmentState, NewInstallmentPayment } from "@/server/domain/installment";

function createDependencies(installment: InstallmentState | null) {
  const added: ({ installmentId: string } & NewInstallmentPayment)[] = [];
  const installmentReader: InstallmentReader = {
    findById: () => Promise.resolve(installment),
  };
  const paymentWriter: Pick<InstallmentPaymentWriter, "addPayment"> = {
    addPayment(installmentId, payment) {
      added.push({ installmentId, ...payment });
      return Promise.resolve();
    },
  };
  return { installmentReader, paymentWriter, added };
}

const unpaid: InstallmentState = { amount: Money.fromReais(50), payments: [] };
const input = {
  amount: "50",
  paidAt: "2026-10-05",
  paymentMethod: "pix",
  receivedByUserId: "user-2",
};

describe("payInstallment", () => {
  it("registra o pagamento com valor, data, forma, quem recebeu e quem registrou", async () => {
    const dependencies = createDependencies(unpaid);

    const result = await payInstallment(
      dependencies,
      "installment-1",
      input,
      "user-1",
      new Date("2026-10-20"),
    );

    expect(dependencies.added).toEqual([
      {
        installmentId: "installment-1",
        amount: Money.fromReais(50),
        paidAt: new Date("2026-10-05"),
        paymentMethod: "pix",
        receivedByUserId: "user-2",
        registeredByUserId: "user-1",
      },
    ]);
    expect(result.remaining.toCents()).toBe(0);
  });

  it("registra um valor menor e informa quanto ainda falta", async () => {
    const dependencies = createDependencies(unpaid);

    const result = await payInstallment(
      dependencies,
      "installment-1",
      { ...input, amount: "40" },
      "user-1",
      new Date("2026-10-20"),
    );

    expect(dependencies.added[0]?.amount.toCents()).toBe(4000);
    expect(result.remaining.toCents()).toBe(1000);
  });

  it("não grava nada quando o valor passa do que falta", async () => {
    const dependencies = createDependencies(unpaid);

    await expect(
      payInstallment(
        dependencies,
        "installment-1",
        { ...input, amount: "60" },
        "user-1",
        new Date("2026-10-20"),
      ),
    ).rejects.toThrow("O valor passa do que falta pagar nesta parcela");
    expect(dependencies.added).toEqual([]);
  });

  it("rejeita forma de pagamento inválida", async () => {
    const dependencies = createDependencies(unpaid);

    await expect(
      payInstallment(
        dependencies,
        "installment-1",
        { ...input, paymentMethod: "cheque" },
        "user-1",
        new Date("2026-10-20"),
      ),
    ).rejects.toThrow();
  });

  it("rejeita parcela que não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      payInstallment(dependencies, "installment-x", input, "user-1", new Date("2026-10-20")),
    ).rejects.toThrow("Parcela não encontrada");
  });
});
