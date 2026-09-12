import { describe, expect, it } from "vitest";
import {
  listPledgeTypes,
  type PledgeTypeListRepository,
} from "@/server/application/list-pledge-types";
import { Money } from "@/server/domain/money";
import type { PledgeTypeSummary } from "@/server/domain/pledge-type";

function createInMemoryPledgeTypeListRepository(
  pledgeTypes: PledgeTypeSummary[],
): PledgeTypeListRepository {
  return {
    findAllByCampaign() {
      return Promise.resolve(pledgeTypes);
    },
  };
}

describe("listPledgeTypes", () => {
  it("retorna os tipos de carnê cadastrados na campanha", async () => {
    const pledgeType: PledgeTypeSummary = {
      id: "pledge-type-1",
      campaignId: "campaign-1",
      name: "Bronze",
      installmentValue: Money.fromReais(50),
    };
    const repository = createInMemoryPledgeTypeListRepository([pledgeType]);

    const result = await listPledgeTypes(repository, "campaign-1");

    expect(result).toEqual([pledgeType]);
  });

  it("retorna lista vazia quando não há tipos de carnê cadastrados", async () => {
    const repository = createInMemoryPledgeTypeListRepository([]);

    const result = await listPledgeTypes(repository, "campaign-1");

    expect(result).toEqual([]);
  });
});
