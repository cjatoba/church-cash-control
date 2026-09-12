import { describe, expect, it } from "vitest";
import { parsePledgeType } from "@/server/domain/pledge-type";

describe("parsePledgeType", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    name: "Bronze",
    installmentValue: 50,
  };

  it("cria um tipo de carnê a partir de dados válidos", () => {
    const pledgeType = parsePledgeType(validInput);

    expect(pledgeType.campaignId).toBe(validInput.campaignId);
    expect(pledgeType.name).toBe("Bronze");
    expect(pledgeType.installmentValue.toCents()).toBe(5000);
  });

  it("rejeita nome vazio", () => {
    expect(() => parsePledgeType({ ...validInput, name: "" })).toThrow();
  });

  it("rejeita campanha vazia", () => {
    expect(() => parsePledgeType({ ...validInput, campaignId: "" })).toThrow();
  });

  it("rejeita valor de parcela zero ou negativo", () => {
    expect(() => parsePledgeType({ ...validInput, installmentValue: 0 })).toThrow();
    expect(() => parsePledgeType({ ...validInput, installmentValue: -10 })).toThrow();
  });
});
