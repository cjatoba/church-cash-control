import { describe, expect, it } from "vitest";
import { repriceInstallments, type InstallmentSlot } from "@/server/domain/installment-repricing";

function payment(
  paidAmountCents: number,
  overrides: Partial<NonNullable<InstallmentSlot["payment"]>> = {},
): NonNullable<InstallmentSlot["payment"]> {
  return {
    paidAt: new Date("2026-01-10T12:00:00Z"),
    paidAmountCents,
    paymentMethod: "pix",
    receivedByUserId: "user-1",
    registeredByUserId: "user-1",
    ...overrides,
  };
}

function slots(amountCents: number, payments: (InstallmentSlot["payment"] | undefined)[]) {
  return payments.map((paid, index) => ({
    id: `i${String(index + 1)}`,
    dueDate: new Date(Date.UTC(2026, index, 1)),
    amountCents,
    payment: paid ?? null,
  }));
}

function summarize(result: InstallmentSlot[]) {
  return result.map(
    (slot) =>
      `${slot.id}:${String(slot.amountCents)}:${slot.payment ? `pago ${String(slot.payment.paidAmountCents)}` : "a pagar"}`,
  );
}

describe("repriceInstallments", () => {
  it("divide um pagamento de R$ 100 em duas parcelas pagas de R$ 50 quando o valor cai", () => {
    const result = repriceInstallments(slots(10000, [payment(10000), null, null, null]), 5000);

    expect(summarize(result.installments)).toEqual([
      "i1:5000:pago 5000",
      "i2:5000:pago 5000",
      "i3:5000:a pagar",
      "i4:5000:a pagar",
    ]);
    expect(result.installments[1]?.payment).toMatchObject({
      paymentMethod: "pix",
      receivedByUserId: "user-1",
    });
    expect(result.paymentsRedistributed).toBe(true);
  });

  it("junta dois pagamentos iguais de R$ 50 numa parcela paga de R$ 100 quando o valor sobe", () => {
    const result = repriceInstallments(slots(5000, [payment(5000), payment(5000), null]), 10000);

    expect(summarize(result.installments)).toEqual([
      "i1:10000:pago 10000",
      "i2:10000:a pagar",
      "i3:10000:a pagar",
    ]);
    expect(result.paymentsRedistributed).toBe(true);
  });

  it("não junta pagamentos feitos em datas ou por pessoas diferentes", () => {
    const result = repriceInstallments(
      slots(5000, [
        payment(5000),
        payment(5000, { paidAt: new Date("2026-02-10T12:00:00Z") }),
        null,
      ]),
      10000,
    );

    expect(summarize(result.installments)).toEqual([
      "i1:5000:pago 5000",
      "i2:5000:pago 5000",
      "i3:10000:a pagar",
    ]);
    expect(result.paymentsRedistributed).toBe(false);
  });

  it("mantém o pagamento como está quando não fecha certinho com o valor novo", () => {
    const result = repriceInstallments(slots(10000, [payment(10000), null, null]), 3000);

    expect(summarize(result.installments)).toEqual([
      "i1:10000:pago 10000",
      "i2:3000:a pagar",
      "i3:3000:a pagar",
    ]);
    expect(result.paymentsRedistributed).toBe(false);
  });

  it("não redistribui quando o que já foi pago passaria do número de parcelas do carnê", () => {
    const result = repriceInstallments(slots(10000, [payment(10000), payment(10000)]), 5000);

    expect(summarize(result.installments)).toEqual(["i1:10000:pago 10000", "i2:10000:pago 10000"]);
    expect(result.paymentsRedistributed).toBe(false);
  });

  it("sem pagamento, só troca o valor das parcelas", () => {
    const result = repriceInstallments(slots(10000, [null, null]), 5000);

    expect(summarize(result.installments)).toEqual(["i1:5000:a pagar", "i2:5000:a pagar"]);
    expect(result.paymentsRedistributed).toBe(false);
  });
});
