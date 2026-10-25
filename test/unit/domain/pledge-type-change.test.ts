import { describe, expect, it } from "vitest";
import { Money } from "@/server/domain/money";
import { planPledgeTypeChange } from "@/server/domain/pledge-type-change";

const fixedPledge = { kind: "fixed" as const, pledgeTypeId: "type-50", hasPayments: false };
const loosePledge = { kind: "loose" as const, pledgeTypeId: "type-loose", hasPayments: false };
const fixedType100 = { id: "type-100", installmentValue: Money.fromReais(100) };
const otherLooseType = { id: "type-loose-2", installmentValue: null };

describe("planPledgeTypeChange", () => {
  it("troca entre tipos de valor fixo mudando o valor das parcelas, mesmo com pagamento", () => {
    const plan = planPledgeTypeChange({ ...fixedPledge, hasPayments: true }, fixedType100);

    expect(plan.kind).toBe("reprice");
    expect(plan.kind === "reprice" && plan.installmentValue.toCents()).toBe(10000);
  });

  it("troca entre tipos avulsos só trocando o tipo, mesmo com entregas", () => {
    const plan = planPledgeTypeChange({ ...loosePledge, hasPayments: true }, otherLooseType);

    expect(plan).toEqual({ kind: "relabel" });
  });

  it("converte carnê de valor fixo em avulso enquanto nada foi pago", () => {
    expect(planPledgeTypeChange(fixedPledge, otherLooseType)).toEqual({ kind: "toLoose" });
  });

  it("converte carnê avulso em valor fixo enquanto nada foi entregue", () => {
    const plan = planPledgeTypeChange(loosePledge, fixedType100);

    expect(plan.kind).toBe("toFixed");
    expect(plan.kind === "toFixed" && plan.installmentValue.toCents()).toBe(10000);
  });

  it("não converte entre valor fixo e avulso quando já há pagamento, para não perder histórico", () => {
    expect(() =>
      planPledgeTypeChange({ ...fixedPledge, hasPayments: true }, otherLooseType),
    ).toThrow("já tem pagamento registrado");
    expect(() => planPledgeTypeChange({ ...loosePledge, hasPayments: true }, fixedType100)).toThrow(
      "já tem pagamento registrado",
    );
  });

  it("rejeita escolher o mesmo tipo que o carnê já tem", () => {
    expect(() =>
      planPledgeTypeChange(fixedPledge, { id: "type-50", installmentValue: Money.fromReais(50) }),
    ).toThrow("Escolha um tipo de carnê diferente do atual");
  });
});
