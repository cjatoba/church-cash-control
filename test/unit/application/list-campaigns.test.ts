import { describe, expect, it } from "vitest";
import { listCampaigns, type CampaignListRepository } from "@/server/application/list-campaigns";
import { Money } from "@/server/domain/money";
import type { CampaignSummary } from "@/server/domain/campaign";

function createInMemoryCampaignListRepository(
  campaigns: CampaignSummary[],
): CampaignListRepository {
  return {
    findAll() {
      return Promise.resolve(campaigns);
    },
  };
}

describe("listCampaigns", () => {
  it("retorna as campanhas cadastradas", async () => {
    const campaign: CampaignSummary = {
      id: "campaign-1",
      name: "Campanha X",
      goal: Money.fromReais(5000),
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      active: true,
    };
    const repository = createInMemoryCampaignListRepository([campaign]);

    const result = await listCampaigns(repository);

    expect(result).toEqual([campaign]);
  });

  it("retorna lista vazia quando não há campanhas cadastradas", async () => {
    const repository = createInMemoryCampaignListRepository([]);

    const result = await listCampaigns(repository);

    expect(result).toEqual([]);
  });
});
