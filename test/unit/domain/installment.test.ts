import { describe, expect, it } from "vitest";
import {
  correctInstallmentPayment,
  payInstallment,
  revertInstallmentPayment,
} from "@/server/domain/installment";
import { Money } from "@/server/domain/money";

const unpaidInstallment = {
  amount: Money.fromReais(100),
  paidAt: null,
  paymentMethod: null,
  receivedByUserId: null,
  registeredByUserId: null,
};

describe("payInstallment", () => {
  it("registra data, forma de pagamento, recebedor e registrante do pagamento", () => {
    const payment = payInstallment(
      unpaidInstallment,
      new Date("2026-03-10"),
      "pix",
      "user-1",
      "user-1",
      new Date("2026-03-10"),
    );

    expect(payment.paidAt).toEqual(new Date("2026-03-10"));
    expect(payment.paidAmount.equals(Money.fromReais(100))).toBe(true);
    expect(payment.paymentMethod).toBe("pix");
    expect(payment.receivedByUserId).toBe("user-1");
    expect(payment.registeredByUserId).toBe("user-1");
  });

  it("permite registrar em nome de outro usuário, mantendo quem de fato registrou", () => {
    const payment = payInstallment(
      unpaidInstallment,
      new Date("2026-03-10"),
      "cash",
      "user-2",
      "user-1",
      new Date("2026-03-10"),
    );

    expect(payment.receivedByUserId).toBe("user-2");
    expect(payment.registeredByUserId).toBe("user-1");
  });

  it("aceita uma data de pagamento anterior a hoje", () => {
    const payment = payInstallment(
      unpaidInstallment,
      new Date("2026-03-01"),
      "pix",
      "user-1",
      "user-1",
      new Date("2026-03-10"),
    );

    expect(payment.paidAt).toEqual(new Date("2026-03-01"));
  });

  it("rejeita dar baixa numa parcela já paga", () => {
    const installment = {
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-01"),
      paymentMethod: "pix" as const,
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    };

    expect(() =>
      payInstallment(
        installment,
        new Date("2026-03-10"),
        "pix",
        "user-1",
        "user-1",
        new Date("2026-03-10"),
      ),
    ).toThrow();
  });

  it("rejeita data de pagamento no futuro", () => {
    expect(() =>
      payInstallment(
        unpaidInstallment,
        new Date("2026-03-11"),
        "pix",
        "user-1",
        "user-1",
        new Date("2026-03-10"),
      ),
    ).toThrow();
  });
});

describe("correctInstallmentPayment", () => {
  const paidInstallment = {
    amount: Money.fromReais(100),
    paidAt: new Date("2026-03-10"),
    paymentMethod: "pix" as const,
    receivedByUserId: "user-1",
    registeredByUserId: "user-1",
  };
  const today = new Date("2026-03-10");

  it("corrige data, forma de pagamento e quem recebeu, mantendo o valor e quem registrou", () => {
    const payment = correctInstallmentPayment(
      paidInstallment,
      { paidAt: new Date("2026-03-05"), paymentMethod: "cash", receivedByUserId: "user-2" },
      Money.fromReais(100),
      today,
    );

    expect(payment.paidAt).toEqual(new Date("2026-03-05"));
    expect(payment.paidAmount.equals(Money.fromReais(100))).toBe(true);
    expect(payment.paymentMethod).toBe("cash");
    expect(payment.receivedByUserId).toBe("user-2");
    expect(payment.registeredByUserId).toBe("user-1");
  });

  it("não deixa trocar quem recebeu se essa pessoa já repassou o dinheiro", () => {
    expect(() =>
      correctInstallmentPayment(
        paidInstallment,
        { paidAt: new Date("2026-03-10"), paymentMethod: "pix", receivedByUserId: "user-2" },
        Money.fromReais(40),
        today,
      ),
    ).toThrow("Corrija o repasse primeiro");
  });

  it("permite corrigir só a data mesmo que o dinheiro já tenha sido repassado", () => {
    expect(() =>
      correctInstallmentPayment(
        paidInstallment,
        { paidAt: new Date("2026-03-01"), paymentMethod: "pix", receivedByUserId: "user-1" },
        Money.fromCents(0),
        today,
      ),
    ).not.toThrow();
  });

  it("rejeita corrigir parcela que ainda não foi paga", () => {
    expect(() =>
      correctInstallmentPayment(
        unpaidInstallment,
        { paidAt: new Date("2026-03-05"), paymentMethod: "pix", receivedByUserId: "user-1" },
        Money.fromCents(0),
        today,
      ),
    ).toThrow("ainda não foi paga");
  });

  it("rejeita nova data de pagamento no futuro", () => {
    expect(() =>
      correctInstallmentPayment(
        paidInstallment,
        { paidAt: new Date("2026-03-11"), paymentMethod: "pix", receivedByUserId: "user-1" },
        Money.fromReais(100),
        today,
      ),
    ).toThrow("no futuro");
  });
});

describe("revertInstallmentPayment", () => {
  const paidInstallment = {
    amount: Money.fromReais(100),
    paidAt: new Date("2026-03-10"),
    paymentMethod: "pix" as const,
    receivedByUserId: "user-1",
    registeredByUserId: "user-1",
  };

  it("permite reverter uma parcela paga quando o saldo em mãos cobre o valor", () => {
    expect(() => {
      revertInstallmentPayment(paidInstallment, Money.fromReais(100));
    }).not.toThrow();
  });

  it("rejeita reverter uma parcela que ainda não foi paga", () => {
    expect(() => {
      revertInstallmentPayment(unpaidInstallment, Money.fromReais(100));
    }).toThrow();
  });

  it("rejeita reverter quando o valor já foi repassado e deixaria o saldo negativo", () => {
    expect(() => {
      revertInstallmentPayment(paidInstallment, Money.fromReais(40));
    }).toThrow();
  });
});
