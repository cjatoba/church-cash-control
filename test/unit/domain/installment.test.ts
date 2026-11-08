import { describe, expect, it } from "vitest";
import {
  correctInstallmentPayment,
  isFullyPaid,
  payInstallment,
  remainingToPay,
  removeInstallmentPayment,
  sumPaid,
  type InstallmentPaymentRecord,
  type InstallmentState,
} from "@/server/domain/installment";
import { Money } from "@/server/domain/money";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";

const today = new Date("2026-10-20");

function payment(overrides: Partial<InstallmentPaymentRecord> = {}): InstallmentPaymentRecord {
  return {
    id: "payment-1",
    amount: Money.fromReais(40),
    paidAt: new Date("2026-10-05"),
    paymentMethod: "pix",
    receivedByUserId: "user-1",
    registeredByUserId: "user-1",
    ...overrides,
  };
}

function installment(payments: InstallmentPaymentRecord[] = []): InstallmentState {
  return { amount: Money.fromReais(50), payments };
}

const newPayment = {
  amount: Money.fromReais(50),
  paidAt: new Date("2026-10-05"),
  paymentMethod: "pix" as const,
  receivedByUserId: "user-2",
  registeredByUserId: "user-1",
};

describe("situação da parcela", () => {
  it("soma o que foi pago e calcula quanto falta", () => {
    const partial = installment([payment()]);

    expect(sumPaid(partial).toCents()).toBe(4000);
    expect(remainingToPay(partial).toCents()).toBe(1000);
    expect(isFullyPaid(partial)).toBe(false);
  });

  it("fica paga quando os pagamentos somam o valor da parcela", () => {
    const paidInTwo = installment([
      payment(),
      payment({ id: "payment-2", amount: Money.fromReais(10) }),
    ]);

    expect(isFullyPaid(paidInTwo)).toBe(true);
    expect(remainingToPay(paidInTwo).toCents()).toBe(0);
  });

  it("parcela sem pagamento falta inteira", () => {
    expect(remainingToPay(installment()).toCents()).toBe(5000);
    expect(isFullyPaid(installment())).toBe(false);
  });

  it("continua paga, sem falta negativa, se o pago passar do valor da parcela", () => {
    const overpaid = installment([payment({ amount: Money.fromReais(60) })]);

    expect(isFullyPaid(overpaid)).toBe(true);
    expect(remainingToPay(overpaid).toCents()).toBe(0);
  });
});

describe("payInstallment", () => {
  it("registra o pagamento inteiro com forma, recebedor e quem registrou", () => {
    const registered = payInstallment(installment(), newPayment, today);

    expect(registered).toEqual(newPayment);
  });

  it("aceita um valor menor que a parcela, deixando o restante em aberto", () => {
    const registered = payInstallment(
      installment(),
      { ...newPayment, amount: Money.fromReais(40) },
      today,
    );

    expect(registered.amount.toCents()).toBe(4000);
  });

  it("aceita completar o restante de uma parcela paga em parte", () => {
    const registered = payInstallment(
      installment([payment()]),
      { ...newPayment, amount: Money.fromReais(10) },
      today,
    );

    expect(registered.amount.toCents()).toBe(1000);
  });

  it("rejeita valor maior do que falta pagar", () => {
    expect(() =>
      payInstallment(
        installment([payment()]),
        { ...newPayment, amount: Money.fromReais(20) },
        today,
      ),
    ).toThrow("O valor passa do que falta pagar nesta parcela");
  });

  it("rejeita valor zero", () => {
    expect(() =>
      payInstallment(installment(), { ...newPayment, amount: Money.fromCents(0) }, today),
    ).toThrow("Informe um valor maior que zero");
  });

  it("rejeita pagamento numa parcela já paga", () => {
    const paid = installment([payment({ amount: Money.fromReais(50) })]);

    expect(() => payInstallment(paid, newPayment, today)).toThrow("Parcela já está paga");
  });

  it("rejeita data de pagamento no futuro", () => {
    expect(() =>
      payInstallment(installment(), { ...newPayment, paidAt: new Date("2026-10-21") }, today),
    ).toThrow("Data de pagamento não pode ser no futuro");
  });
});

describe("correctInstallmentPayment", () => {
  const correction = {
    amount: Money.fromReais(40),
    paidAt: new Date("2026-10-06"),
    paymentMethod: "cash" as const,
    receivedByUserId: "user-1",
  };

  it("corrige data, forma, quem recebeu e valor, mantendo quem registrou", () => {
    const corrected = correctInstallmentPayment(
      installment([payment({ registeredByUserId: "user-9" })]),
      "payment-1",
      { ...correction, amount: Money.fromReais(50), receivedByUserId: "user-2" },
      Money.fromReais(40),
      today,
    );

    expect(corrected).toEqual({
      id: "payment-1",
      amount: Money.fromReais(50),
      paidAt: new Date("2026-10-06"),
      paymentMethod: "cash",
      receivedByUserId: "user-2",
      registeredByUserId: "user-9",
    });
  });

  it("aceita valor até o que cabe na parcela, contando os outros pagamentos", () => {
    const paidInTwo = installment([
      payment({ amount: Money.fromReais(30) }),
      payment({ id: "payment-2", amount: Money.fromReais(10) }),
    ]);

    expect(
      correctInstallmentPayment(
        paidInTwo,
        "payment-1",
        { ...correction, amount: Money.fromReais(40) },
        Money.fromReais(100),
        today,
      ).amount.toCents(),
    ).toBe(4000);
    expect(() =>
      correctInstallmentPayment(
        paidInTwo,
        "payment-1",
        { ...correction, amount: Money.fromReais(41) },
        Money.fromReais(100),
        today,
      ),
    ).toThrow("O valor passa do que falta pagar nesta parcela");
  });

  it("rejeita valor zero", () => {
    expect(() =>
      correctInstallmentPayment(
        installment([payment()]),
        "payment-1",
        { ...correction, amount: Money.fromCents(0) },
        Money.fromReais(100),
        today,
      ),
    ).toThrow("Informe um valor maior que zero");
  });

  it("rejeita pagamento que não é desta parcela", () => {
    expect(() =>
      correctInstallmentPayment(
        installment([payment()]),
        "payment-x",
        correction,
        Money.fromReais(100),
        today,
      ),
    ).toThrow("Pagamento não encontrado");
  });

  it("rejeita data no futuro", () => {
    expect(() =>
      correctInstallmentPayment(
        installment([payment()]),
        "payment-1",
        { ...correction, paidAt: new Date("2026-10-21") },
        Money.fromReais(100),
        today,
      ),
    ).toThrow("Data de pagamento não pode ser no futuro");
  });

  it("não deixa diminuir o valor se quem recebeu já repassou esse dinheiro", () => {
    expect(() =>
      correctInstallmentPayment(
        installment([payment()]),
        "payment-1",
        { ...correction, amount: Money.fromReais(30) },
        Money.fromReais(5),
        today,
      ),
    ).toThrow(FundsAlreadyTransferredError);
  });

  it("deixa aumentar o valor mesmo com o saldo de quem recebeu zerado", () => {
    expect(
      correctInstallmentPayment(
        installment([payment()]),
        "payment-1",
        { ...correction, amount: Money.fromReais(50) },
        Money.fromCents(0),
        today,
      ).amount.toCents(),
    ).toBe(5000);
  });
});

describe("removeInstallmentPayment", () => {
  it("permite excluir um pagamento quando quem recebeu ainda tem o dinheiro", () => {
    expect(() => {
      removeInstallmentPayment(installment([payment()]), "payment-1", Money.fromReais(40));
    }).not.toThrow();
  });

  it("não deixa excluir se o dinheiro já foi repassado, apontando quem recebeu", () => {
    try {
      removeInstallmentPayment(installment([payment()]), "payment-1", Money.fromReais(10));
      expect.unreachable();
    } catch (error) {
      if (!(error instanceof FundsAlreadyTransferredError)) {
        throw error;
      }
      expect(error.receiverUserId).toBe("user-1");
    }
  });

  it("permite excluir pagamento antigo sem quem recebeu registrado", () => {
    expect(() => {
      removeInstallmentPayment(
        installment([payment({ receivedByUserId: null })]),
        "payment-1",
        Money.fromCents(0),
      );
    }).not.toThrow();
  });

  it("rejeita pagamento que não é desta parcela", () => {
    expect(() => {
      removeInstallmentPayment(installment([payment()]), "payment-x", Money.fromReais(40));
    }).toThrow("Pagamento não encontrado");
  });
});
