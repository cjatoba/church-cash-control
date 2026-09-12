import { describe, expect, it } from "vitest";
import {
  correctInstallmentPaymentDate,
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

describe("correctInstallmentPaymentDate", () => {
  const paidInstallment = {
    amount: Money.fromReais(100),
    paidAt: new Date("2026-03-10"),
    paymentMethod: "pix" as const,
    receivedByUserId: "user-1",
    registeredByUserId: "user-1",
  };

  it("corrige a data de pagamento mantendo valor, forma de pagamento e recebedor", () => {
    const payment = correctInstallmentPaymentDate(
      paidInstallment,
      new Date("2026-03-05"),
      new Date("2026-03-10"),
    );

    expect(payment.paidAt).toEqual(new Date("2026-03-05"));
    expect(payment.paidAmount.equals(Money.fromReais(100))).toBe(true);
    expect(payment.paymentMethod).toBe("pix");
    expect(payment.receivedByUserId).toBe("user-1");
    expect(payment.registeredByUserId).toBe("user-1");
  });

  it("rejeita corrigir parcela que ainda não foi paga", () => {
    expect(() =>
      correctInstallmentPaymentDate(
        unpaidInstallment,
        new Date("2026-03-05"),
        new Date("2026-03-10"),
      ),
    ).toThrow();
  });

  it("rejeita nova data de pagamento no futuro", () => {
    expect(() =>
      correctInstallmentPaymentDate(
        paidInstallment,
        new Date("2026-03-11"),
        new Date("2026-03-10"),
      ),
    ).toThrow();
  });
});

describe("revertInstallmentPayment", () => {
  it("permite reverter uma parcela paga", () => {
    const installment = {
      amount: Money.fromReais(100),
      paidAt: new Date("2026-03-10"),
      paymentMethod: "pix" as const,
      receivedByUserId: "user-1",
      registeredByUserId: "user-1",
    };

    expect(() => {
      revertInstallmentPayment(installment);
    }).not.toThrow();
  });

  it("rejeita reverter uma parcela que ainda não foi paga", () => {
    expect(() => {
      revertInstallmentPayment(unpaidInstallment);
    }).toThrow();
  });
});
