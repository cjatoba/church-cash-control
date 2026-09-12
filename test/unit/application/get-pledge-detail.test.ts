import { describe, expect, it } from "vitest";
import { getPledgeDetail, type PledgeDetailReader } from "@/server/application/get-pledge-detail";
import { Money } from "@/server/domain/money";
import type { PledgeDetail } from "@/server/domain/pledge";

function createInMemoryPledgeDetailReader(pledge: PledgeDetail | null): PledgeDetailReader {
  return {
    findById() {
      return Promise.resolve(pledge);
    },
  };
}

describe("getPledgeDetail", () => {
  it("retorna o carnê com as parcelas", async () => {
    const pledge: PledgeDetail = {
      id: "pledge-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Prata",
      installmentValue: Money.fromReais(100),
      installments: [
        {
          id: "installment-1",
          dueDate: new Date("2026-03-01"),
          amount: Money.fromReais(100),
          paidAt: null,
          paidAmount: null,
        },
      ],
    };
    const repository = createInMemoryPledgeDetailReader(pledge);

    const result = await getPledgeDetail(repository, "pledge-1");

    expect(result).toEqual(pledge);
  });

  it("retorna null quando o carnê não existe", async () => {
    const repository = createInMemoryPledgeDetailReader(null);

    const result = await getPledgeDetail(repository, "pledge-1");

    expect(result).toBeNull();
  });
});
