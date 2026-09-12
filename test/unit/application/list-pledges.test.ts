import { describe, expect, it } from "vitest";
import { listPledges, type PledgeListRepository } from "@/server/application/list-pledges";
import { Money } from "@/server/domain/money";
import type { PledgeSummary } from "@/server/domain/pledge";

function createInMemoryPledgeListRepository(pledges: PledgeSummary[]): PledgeListRepository {
  return {
    findAllByCampaign() {
      return Promise.resolve(pledges);
    },
  };
}

describe("listPledges", () => {
  it("retorna os carnês cadastrados na campanha", async () => {
    const pledge: PledgeSummary = {
      id: "pledge-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Prata",
      installmentValue: Money.fromReais(100),
      totalInstallments: 6,
      paidInstallments: 3,
    };
    const repository = createInMemoryPledgeListRepository([pledge]);

    const result = await listPledges(repository, "campaign-1");

    expect(result).toEqual([pledge]);
  });

  it("retorna lista vazia quando não há carnês cadastrados", async () => {
    const repository = createInMemoryPledgeListRepository([]);

    const result = await listPledges(repository, "campaign-1");

    expect(result).toEqual([]);
  });
});
