import { describe, expect, it } from "vitest";
import { payInstallment } from "@/server/domain/installment";
import { Money } from "@/server/domain/money";

describe("payInstallment", () => {
  it("registra a data informada e o valor da parcela como pagos", () => {
    const installment = { amount: Money.fromReais(100), paidAt: null };

    const payment = payInstallment(installment, new Date("2026-03-10"));

    expect(payment.paidAt).toEqual(new Date("2026-03-10"));
    expect(payment.paidAmount.equals(Money.fromReais(100))).toBe(true);
  });

  it("rejeita dar baixa numa parcela já paga", () => {
    const installment = { amount: Money.fromReais(100), paidAt: new Date("2026-03-01") };

    expect(() => payInstallment(installment, new Date("2026-03-10"))).toThrow();
  });
});
