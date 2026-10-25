import { describe, expect, it } from "vitest";
import {
  listOneOffDonations,
  type OneOffDonationListRepository,
} from "@/server/application/list-one-off-donations";
import { Money } from "@/server/domain/money";
import type { OneOffDonationSummary } from "@/server/domain/one-off-donation";

function createInMemoryRepository(
  donations: OneOffDonationSummary[],
): OneOffDonationListRepository {
  return {
    findAllByCampaign() {
      return Promise.resolve(donations);
    },
  };
}

function donation(id: string, date: string): OneOffDonationSummary {
  return {
    id,
    donorName: "Doador de teste",
    amount: Money.fromReais(50),
    date: new Date(date),
    paymentMethod: "pix",
  };
}

describe("listOneOffDonations", () => {
  it("lista as doações sem carnê da mais recente para a mais antiga", async () => {
    const repository = createInMemoryRepository([
      donation("antiga", "2026-08-01"),
      donation("recente", "2026-10-20"),
      donation("meio", "2026-09-15"),
    ]);

    const result = await listOneOffDonations(repository, "campaign-1");

    expect(result.map((item) => item.id)).toEqual(["recente", "meio", "antiga"]);
  });

  it("retorna lista vazia quando a campanha não tem doações sem carnê", async () => {
    const result = await listOneOffDonations(createInMemoryRepository([]), "campaign-1");

    expect(result).toEqual([]);
  });
});
