import { describe, expect, it } from "vitest";
import {
  updateCampaign,
  type CampaignUpdateRepository,
} from "@/server/application/update-campaign";
import type { Campaign } from "@/server/domain/campaign";

function createInMemoryCampaignUpdateRepository(): CampaignUpdateRepository & {
  updates: { id: string; campaign: Campaign }[];
} {
  const updates: { id: string; campaign: Campaign }[] = [];
  return {
    updates,
    update(id, campaign) {
      updates.push({ id, campaign });
      return Promise.resolve();
    },
  };
}

describe("updateCampaign", () => {
  const validInput = {
    name: "Campanha X",
    goal: 5000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  it("atualiza os dados da campanha existente", async () => {
    const repository = createInMemoryCampaignUpdateRepository();

    await updateCampaign(repository, "campaign-1", validInput);

    expect(repository.updates).toHaveLength(1);
    expect(repository.updates[0]?.id).toBe("campaign-1");
    expect(repository.updates[0]?.campaign.name).toBe("Campanha X");
    expect(repository.updates[0]?.campaign.goal.toCents()).toBe(500000);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryCampaignUpdateRepository();

    await expect(
      updateCampaign(repository, "campaign-1", { ...validInput, name: "" }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });
});
