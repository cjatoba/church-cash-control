import { describe, expect, it } from "vitest";
import { createCampaign, type CampaignRepository } from "@/server/application/create-campaign";
import type { Campaign } from "@/server/domain/campaign";

function createInMemoryCampaignRepository(): CampaignRepository & { saved: Campaign[] } {
  const saved: Campaign[] = [];
  return {
    saved,
    create(campaign) {
      saved.push(campaign);
      return Promise.resolve({ id: `campaign-${String(saved.length)}` });
    },
  };
}

describe("createCampaign", () => {
  const validInput = {
    name: "Campanha X",
    goal: 5000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  it("persiste a campanha válida e retorna o id gerado", async () => {
    const repository = createInMemoryCampaignRepository();

    const result = await createCampaign(repository, validInput);

    expect(result.id).toBe("campaign-1");
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.name).toBe("Campanha X");
    expect(repository.saved[0]?.goal.toCents()).toBe(500000);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryCampaignRepository();

    await expect(createCampaign(repository, { ...validInput, name: "" })).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
