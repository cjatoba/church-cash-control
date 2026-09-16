import { describe, expect, it } from "vitest";
import { addLoosePledgeContribution, parseLoosePledgeInput } from "@/server/domain/loose-pledge";

describe("parseLoosePledgeInput", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorId: "22222222-2222-2222-2222-222222222222",
    pledgeTypeId: "33333333-3333-3333-3333-333333333333",
  };

  it("aceita dados válidos", () => {
    expect(parseLoosePledgeInput(validInput)).toEqual(validInput);
  });

  it("rejeita campanha vazia", () => {
    expect(() => parseLoosePledgeInput({ ...validInput, campaignId: "" })).toThrow();
  });

  it("rejeita doador vazio", () => {
    expect(() => parseLoosePledgeInput({ ...validInput, donorId: "" })).toThrow();
  });

  it("rejeita tipo de carnê vazio", () => {
    expect(() => parseLoosePledgeInput({ ...validInput, pledgeTypeId: "" })).toThrow();
  });
});

describe("addLoosePledgeContribution", () => {
  const validInput = {
    amount: 50,
    date: "2026-03-10",
    paymentMethod: "pix",
    receivedByUserId: "user-1",
  };
  const registeredByUserId = "user-1";

  it("registra uma contribuição quando o carnê avulso está aberto", () => {
    const contribution = addLoosePledgeContribution(
      { status: "open" },
      validInput,
      registeredByUserId,
    );

    expect(contribution.amount.toCents()).toBe(5000);
    expect(contribution.date).toEqual(new Date("2026-03-10"));
    expect(contribution.paymentMethod).toBe("pix");
    expect(contribution.receivedByUserId).toBe("user-1");
    expect(contribution.registeredByUserId).toBe("user-1");
  });

  it("registra quem recebeu de forma independente de quem registrou", () => {
    const contribution = addLoosePledgeContribution(
      { status: "open" },
      { ...validInput, receivedByUserId: "user-2" },
      "user-1",
    );

    expect(contribution.receivedByUserId).toBe("user-2");
    expect(contribution.registeredByUserId).toBe("user-1");
  });

  it("rejeita registrar contribuição num carnê avulso encerrado", () => {
    expect(() =>
      addLoosePledgeContribution({ status: "closed" }, validInput, registeredByUserId),
    ).toThrow("Carnê avulso encerrado");
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() =>
      addLoosePledgeContribution(
        { status: "open" },
        { ...validInput, amount: 0 },
        registeredByUserId,
      ),
    ).toThrow();
    expect(() =>
      addLoosePledgeContribution(
        { status: "open" },
        { ...validInput, amount: -10 },
        registeredByUserId,
      ),
    ).toThrow();
  });

  it("rejeita forma de pagamento desconhecida", () => {
    expect(() =>
      addLoosePledgeContribution(
        { status: "open" },
        { ...validInput, paymentMethod: "boleto" },
        registeredByUserId,
      ),
    ).toThrow();
  });

  it("rejeita recebedor vazio", () => {
    expect(() =>
      addLoosePledgeContribution(
        { status: "open" },
        { ...validInput, receivedByUserId: "" },
        registeredByUserId,
      ),
    ).toThrow();
  });
});
