import { describe, expect, it } from "vitest";
import {
  listLoosePledges,
  type LoosePledgeListRepository,
} from "@/server/application/list-loose-pledges";
import { Money } from "@/server/domain/money";
import type { LoosePledgeSummary } from "@/server/domain/loose-pledge";

function createInMemoryRepository(pledges: LoosePledgeSummary[]): LoosePledgeListRepository {
  return {
    findAllByCampaign() {
      return Promise.resolve(pledges);
    },
  };
}

describe("listLoosePledges", () => {
  it("retorna os carnês avulsos cadastrados na campanha", async () => {
    const pledge: LoosePledgeSummary = {
      id: "loose-pledge-1",
      donorId: "donor-1",
      donorName: "Maria Souza",
      status: "open",
      totalContributed: Money.fromReais(50),
    };
    const repository = createInMemoryRepository([pledge]);

    const result = await listLoosePledges(repository, "campaign-1");

    expect(result).toEqual([pledge]);
  });

  it("retorna lista vazia quando não há carnês avulsos cadastrados", async () => {
    const repository = createInMemoryRepository([]);

    const result = await listLoosePledges(repository, "campaign-1");

    expect(result).toEqual([]);
  });
});
