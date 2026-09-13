import { describe, expect, it } from "vitest";
import { calculateCampaignProgressPercentage, parseCampaign } from "@/server/domain/campaign";
import { Money } from "@/server/domain/money";

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

describe("calculateCampaignProgressPercentage", () => {
  it("retorna 0% quando nada foi arrecadado", () => {
    const percentage = calculateCampaignProgressPercentage(
      Money.fromCents(0),
      Money.fromReais(1000),
    );

    expect(percentage).toBe(0);
  });

  it("retorna a porcentagem arredondada de quanto da meta já foi arrecadado", () => {
    const percentage = calculateCampaignProgressPercentage(
      Money.fromReais(333),
      Money.fromReais(1000),
    );

    expect(percentage).toBe(33);
  });

  it("retorna 100% quando a meta foi atingida", () => {
    const percentage = calculateCampaignProgressPercentage(
      Money.fromReais(1000),
      Money.fromReais(1000),
    );

    expect(percentage).toBe(100);
  });

  it("limita em 100% quando o arrecadado ultrapassa a meta", () => {
    const percentage = calculateCampaignProgressPercentage(
      Money.fromReais(1500),
      Money.fromReais(1000),
    );

    expect(percentage).toBe(100);
  });
});
