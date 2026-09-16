import { describe, expect, it } from "vitest";
import {
  listDonorLoosePledges,
  type DonorLoosePledgeListRepository,
  type DonorLoosePledgeSummary,
} from "@/server/application/list-donor-loose-pledges";
import { Money } from "@/server/domain/money";

function createInMemoryRepository(
  pledges: DonorLoosePledgeSummary[],
): DonorLoosePledgeListRepository {
  return {
    findAllByDonor() {
      return Promise.resolve(pledges);
    },
  };
}

describe("listDonorLoosePledges", () => {
  it("retorna os carnês avulsos do doador em todas as campanhas", async () => {
    const pledge: DonorLoosePledgeSummary = {
      id: "loose-pledge-1",
      donorId: "donor-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Avulso",
      status: "open",
      totalContributed: Money.fromReais(50),
      campaignId: "campaign-1",
      campaignName: "Campanha X",
    };
    const repository = createInMemoryRepository([pledge]);

    const result = await listDonorLoosePledges(repository, "donor-1");

    expect(result).toEqual([pledge]);
  });

  it("retorna lista vazia quando o doador não tem carnês avulsos", async () => {
    const repository = createInMemoryRepository([]);

    const result = await listDonorLoosePledges(repository, "donor-1");

    expect(result).toEqual([]);
  });
});
