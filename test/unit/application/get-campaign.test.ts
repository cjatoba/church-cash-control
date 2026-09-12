import { describe, expect, it } from "vitest";
import {
  getCampaign,
  type CampaignDetail,
  type CampaignDetailRepository,
} from "@/server/application/get-campaign";
import { Money } from "@/server/domain/money";

function createInMemoryCampaignDetailRepository(
  campaign: CampaignDetail | null,
): CampaignDetailRepository {
  return {
    findById() {
      return Promise.resolve(campaign);
    },
  };
}

describe("getCampaign", () => {
  it("retorna os dados da campanha quando ela existe", async () => {
    const campaign: CampaignDetail = {
      name: "Campanha X",
      goal: Money.fromReais(5000),
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      active: true,
    };
    const repository = createInMemoryCampaignDetailRepository(campaign);

    const result = await getCampaign(repository, "campaign-1");

    expect(result).toEqual(campaign);
  });

  it("retorna null quando a campanha não existe", async () => {
    const repository = createInMemoryCampaignDetailRepository(null);

    const result = await getCampaign(repository, "campaign-1");

    expect(result).toBeNull();
  });
});
