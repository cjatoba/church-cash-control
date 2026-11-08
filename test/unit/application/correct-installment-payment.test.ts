import { describe, expect, it } from "vitest";
import {
  correctInstallmentPayment,
  type CorrectInstallmentPaymentDependencies,
} from "@/server/application/correct-installment-payment";
import { Money } from "@/server/domain/money";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";
import type { InstallmentPaymentRecord, InstallmentState } from "@/server/domain/installment";

const partial: InstallmentState = {
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
  ],
};

function createDependencies(
  installment: InstallmentState | null,
  receiverBalance: { receivedCents: number; transferredCents: number },
) {
  const updated: InstallmentPaymentRecord[] = [];
  const dependencies: CorrectInstallmentPaymentDependencies = {
    installmentReader: { findById: () => Promise.resolve(installment) },
    paymentWriter: {
      updatePayment(payment) {
        updated.push(payment);
        return Promise.resolve();
      },
    },
    balanceReader: { getAvailableBalance: () => Promise.resolve(receiverBalance) },
  };
  return { dependencies, updated };
}

const input = {
  amount: "50",
  paidAt: "2026-10-05",
  paymentMethod: "pix",
  receivedByUserId: "user-1",
};

describe("correctInstallmentPayment", () => {
  it("corrige o valor registrado por engano, completando a parcela", async () => {
    const { dependencies, updated } = createDependencies(partial, {
      receivedCents: 4000,
      transferredCents: 0,
    });

    const result = await correctInstallmentPayment(
      dependencies,
      "campaign-1",
      "installment-1",
      "payment-1",
      input,
      new Date("2026-10-20"),
    );

    expect(updated[0]?.amount.toCents()).toBe(5000);
    expect(result.before.amount.toCents()).toBe(4000);
    expect(result.after.amount.toCents()).toBe(5000);
    expect(result.remaining.toCents()).toBe(0);
  });

  it("não grava a correção que deixaria o saldo de quem recebeu negativo", async () => {
    const { dependencies, updated } = createDependencies(partial, {
      receivedCents: 4000,
      transferredCents: 4000,
    });

    await expect(
      correctInstallmentPayment(
        dependencies,
        "campaign-1",
        "installment-1",
        "payment-1",
        { ...input, amount: "30" },
        new Date("2026-10-20"),
      ),
    ).rejects.toThrow(FundsAlreadyTransferredError);
    expect(updated).toEqual([]);
  });

  it("rejeita parcela que não existe", async () => {
    const { dependencies } = createDependencies(null, { receivedCents: 0, transferredCents: 0 });

    await expect(
      correctInstallmentPayment(dependencies, "campaign-1", "installment-x", "payment-1", input),
    ).rejects.toThrow("Parcela não encontrada");
  });

  it("rejeita valor que não é número", async () => {
    const { dependencies } = createDependencies(partial, { receivedCents: 0, transferredCents: 0 });

    await expect(
      correctInstallmentPayment(dependencies, "campaign-1", "installment-1", "payment-1", {
        ...input,
        amount: "abc",
      }),
    ).rejects.toThrow();
  });
});
