import { describe, expect, it } from "vitest";
import {
  archiveCampaign,
  restoreCampaign,
  type CampaignArchiveRepository,
} from "@/server/application/archive-campaign";

function createInMemoryCampaignArchiveRepository(): CampaignArchiveRepository & {
  calls: { id: string; active: boolean }[];
} {
  const calls: { id: string; active: boolean }[] = [];
  return {
    calls,
    setActive(id, active) {
      calls.push({ id, active });
      return Promise.resolve();
    },
  };
}

describe("archiveCampaign", () => {
  it("marca a campanha como inativa", async () => {
    const repository = createInMemoryCampaignArchiveRepository();

    await archiveCampaign(repository, "campaign-1");

    expect(repository.calls).toEqual([{ id: "campaign-1", active: false }]);
  });
});

describe("restoreCampaign", () => {
  it("marca a campanha como ativa novamente", async () => {
    const repository = createInMemoryCampaignArchiveRepository();

    await restoreCampaign(repository, "campaign-1");

    expect(repository.calls).toEqual([{ id: "campaign-1", active: true }]);
  });
});
