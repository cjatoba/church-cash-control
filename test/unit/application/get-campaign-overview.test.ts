import { describe, expect, it } from "vitest";
import {
  getCampaignOverview,
  type CampaignOverviewRepository,
} from "@/server/application/get-campaign-overview";
import type { CampaignSummary } from "@/server/domain/campaign";
import { Money } from "@/server/domain/money";

function createInMemoryRepository(campaigns: CampaignSummary[]): CampaignOverviewRepository {
  return {
    findSummaryById(id) {
      return Promise.resolve(campaigns.find((campaign) => campaign.id === id) ?? null);
    },
  };
}

describe("getCampaignOverview", () => {
  const campaign: CampaignSummary = {
    id: "campaign-1",
    name: "Campanha X",
    goal: Money.fromReais(1000),
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    active: true,
    raisedTotal: Money.fromReais(250),
  };

  it("retorna o resumo da campanha com quanto já foi arrecadado e quanto falta", async () => {
    const overview = await getCampaignOverview(createInMemoryRepository([campaign]), "campaign-1");

    expect(overview?.name).toBe("Campanha X");
    expect(overview?.raisedTotal.toCents()).toBe(Money.fromReais(250).toCents());
    expect(overview?.progressPercentage).toBe(25);
    expect(overview?.amountLeftToGoal.toCents()).toBe(Money.fromReais(750).toCents());
  });

  it("retorna null quando a campanha não existe", async () => {
    const overview = await getCampaignOverview(createInMemoryRepository([campaign]), "outra");

    expect(overview).toBeNull();
  });
});
