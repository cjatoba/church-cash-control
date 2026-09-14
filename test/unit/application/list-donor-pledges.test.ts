import { describe, expect, it } from "vitest";
import {
  listDonorPledges,
  type DonorPledgeListRepository,
  type DonorPledgeSummary,
} from "@/server/application/list-donor-pledges";
import { Money } from "@/server/domain/money";

function createInMemoryDonorPledgeListRepository(
  pledges: DonorPledgeSummary[],
): DonorPledgeListRepository {
  return {
    findAllByDonor() {
      return Promise.resolve(pledges);
    },
  };
}

describe("listDonorPledges", () => {
  it("retorna os carnês do doador em todas as campanhas", async () => {
    const pledge: DonorPledgeSummary = {
      id: "pledge-1",
      donorId: "donor-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Prata",
      installmentValue: Money.fromReais(100),
      totalInstallments: 6,
      paidInstallments: 3,
      campaignId: "campaign-1",
      campaignName: "Campanha X",
    };
    const repository = createInMemoryDonorPledgeListRepository([pledge]);

    const result = await listDonorPledges(repository, "donor-1");

    expect(result).toEqual([pledge]);
  });

  it("retorna lista vazia quando o doador não tem carnês", async () => {
    const repository = createInMemoryDonorPledgeListRepository([]);

    const result = await listDonorPledges(repository, "donor-1");

    expect(result).toEqual([]);
  });
});
