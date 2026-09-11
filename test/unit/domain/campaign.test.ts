import { describe, expect, it } from "vitest";
import { parseCampaign } from "@/server/domain/campaign";

describe("parseCampaign", () => {
  const validInput = {
    name: "Campanha X",
    goal: 5000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  it("cria uma campanha a partir de dados válidos", () => {
    const campaign = parseCampaign(validInput);

    expect(campaign.name).toBe("Campanha X");
    expect(campaign.goal.toCents()).toBe(500000);
    expect(campaign.startDate).toEqual(new Date("2026-01-01"));
    expect(campaign.endDate).toEqual(new Date("2026-12-31"));
  });

  it("rejeita nome vazio", () => {
    expect(() => parseCampaign({ ...validInput, name: "" })).toThrow();
  });

  it("rejeita nome só com espaços", () => {
    expect(() => parseCampaign({ ...validInput, name: "   " })).toThrow();
  });

  it("rejeita meta zero ou negativa", () => {
    expect(() => parseCampaign({ ...validInput, goal: 0 })).toThrow();
    expect(() => parseCampaign({ ...validInput, goal: -100 })).toThrow();
  });

  it("rejeita quando a data de término não é depois da data de início", () => {
    expect(() =>
      parseCampaign({ ...validInput, startDate: "2026-06-01", endDate: "2026-06-01" }),
    ).toThrow();
    expect(() =>
      parseCampaign({ ...validInput, startDate: "2026-06-01", endDate: "2026-01-01" }),
    ).toThrow();
  });
});
