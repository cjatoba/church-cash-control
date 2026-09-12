import { describe, expect, it } from "vitest";
import {
  updateCampaign,
  type CampaignInstallmentsReader,
  type CampaignUpdateRepository,
  type InstallmentsRemover,
} from "@/server/application/update-campaign";
import type { Campaign } from "@/server/domain/campaign";
import type { PendingInstallmentCandidate } from "@/server/domain/pledge";

function createDependencies(installments: PendingInstallmentCandidate[] = []) {
  const updates: { id: string; campaign: Campaign }[] = [];
  const removedIds: string[] = [];

  const campaignRepository: CampaignUpdateRepository = {
    update(id, campaign) {
      updates.push({ id, campaign });
      return Promise.resolve();
    },
  };
  const installmentsReader: CampaignInstallmentsReader = {
    findInstallmentsByCampaign() {
      return Promise.resolve(installments);
    },
  };
  const installmentsRemover: InstallmentsRemover = {
    removeMany(ids) {
      removedIds.push(...ids);
      return Promise.resolve();
    },
  };

  return { campaignRepository, installmentsReader, installmentsRemover, updates, removedIds };
}

describe("updateCampaign", () => {
  const validInput = {
    name: "Campanha X",
    goal: 5000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  it("atualiza os dados da campanha existente", async () => {
    const dependencies = createDependencies();

    await updateCampaign(dependencies, "campaign-1", validInput);

    expect(dependencies.updates).toHaveLength(1);
    expect(dependencies.updates[0]?.id).toBe("campaign-1");
    expect(dependencies.updates[0]?.campaign.name).toBe("Campanha X");
    expect(dependencies.updates[0]?.campaign.goal.toCents()).toBe(500000);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const dependencies = createDependencies();

    await expect(
      updateCampaign(dependencies, "campaign-1", { ...validInput, name: "" }),
    ).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
    expect(dependencies.removedIds).toHaveLength(0);
  });

  it("remove parcelas pendentes que ficaram fora do novo período ao encurtar a campanha", async () => {
    const dependencies = createDependencies([
      { id: "installment-1", dueDate: new Date("2026-12-01"), paidAt: null },
      { id: "installment-2", dueDate: new Date("2027-01-01"), paidAt: null },
    ]);

    await updateCampaign(dependencies, "campaign-1", { ...validInput, endDate: "2026-12-31" });

    expect(dependencies.removedIds).toEqual(["installment-2"]);
  });

  it("nunca remove parcela já paga, mesmo fora do novo período", async () => {
    const dependencies = createDependencies([
      { id: "installment-1", dueDate: new Date("2027-01-01"), paidAt: new Date("2027-01-05") },
    ]);

    await updateCampaign(dependencies, "campaign-1", { ...validInput, endDate: "2026-12-31" });

    expect(dependencies.removedIds).toEqual([]);
  });
});
