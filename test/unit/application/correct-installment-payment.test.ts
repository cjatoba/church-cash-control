import { describe, expect, it } from "vitest";
import {
  correctInstallmentPayment,
  type CorrectInstallmentPaymentDependencies,
} from "@/server/application/correct-installment-payment";
import { Money } from "@/server/domain/money";
import type { InstallmentPayment, InstallmentState } from "@/server/domain/installment";

const paidInstallment: InstallmentState = {
  amount: Money.fromReais(100),
  paidAt: new Date("2026-03-10"),
  paymentMethod: "pix",
  receivedByUserId: "user-1",
  registeredByUserId: "user-1",
};

function createDependencies(
  installment: InstallmentState | null,
  previousReceiverTotals = { receivedCents: 10_000, transferredCents: 0 },
) {
  const saved: { installmentId: string; payment: InstallmentPayment }[] = [];
  const balanceRequests: string[] = [];
  const dependencies: CorrectInstallmentPaymentDependencies = {
    installmentReader: { findById: () => Promise.resolve(installment) },
    installmentRepository: {
      markAsPaid(installmentId, payment) {
        saved.push({ installmentId, payment });
        return Promise.resolve();
      },
    },
    balanceReader: {
      getAvailableBalance(_campaignId, userId) {
        balanceRequests.push(userId);
        return Promise.resolve(previousReceiverTotals);
      },
    },
  };
  return { dependencies, saved, balanceRequests };
}

const today = new Date("2026-03-10");

describe("correctInstallmentPayment", () => {
  it("troca forma de pagamento e quem recebeu, devolvendo o antes e o depois para o registro", async () => {
    const { dependencies, saved, balanceRequests } = createDependencies(paidInstallment);

    const result = await correctInstallmentPayment(
      dependencies,
      "campaign-1",
      "installment-1",
      { paidAt: "2026-03-08", paymentMethod: "cash", receivedByUserId: "user-2" },
      today,
    );

    expect(balanceRequests).toEqual(["user-1"]);
    expect(saved[0]?.installmentId).toBe("installment-1");
    expect(saved[0]?.payment.receivedByUserId).toBe("user-2");
    expect(saved[0]?.payment.paymentMethod).toBe("cash");
    expect(saved[0]?.payment.paidAt).toEqual(new Date("2026-03-08"));
    expect(result.before.receivedByUserId).toBe("user-1");
    expect(result.after.receivedByUserId).toBe("user-2");
  });

  it("não salva quando quem recebeu já repassou o dinheiro", async () => {
    const { dependencies, saved } = createDependencies(paidInstallment, {
      receivedCents: 10_000,
      transferredCents: 10_000,
    });

    await expect(
      correctInstallmentPayment(
        dependencies,
        "campaign-1",
        "installment-1",
        { paidAt: "2026-03-10", paymentMethod: "pix", receivedByUserId: "user-2" },
        today,
      ),
    ).rejects.toThrow("Corrija o repasse primeiro");
    expect(saved).toHaveLength(0);
  });

  it("rejeita quando a parcela não existe", async () => {
    const { dependencies } = createDependencies(null);

    await expect(
      correctInstallmentPayment(
        dependencies,
        "campaign-1",
        "installment-1",
        { paidAt: "2026-03-10", paymentMethod: "pix", receivedByUserId: "user-1" },
        today,
      ),
    ).rejects.toThrow("Parcela não encontrada");
  });

  it("rejeita forma de pagamento desconhecida", async () => {
    const { dependencies } = createDependencies(paidInstallment);

    await expect(
      correctInstallmentPayment(
        dependencies,
        "campaign-1",
        "installment-1",
        { paidAt: "2026-03-10", paymentMethod: "cheque", receivedByUserId: "user-1" },
        today,
      ),
    ).rejects.toThrow();
  });
});
