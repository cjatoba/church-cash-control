import { describe, expect, it } from "vitest";
import {
  getLoosePledgeDetail,
  type LoosePledgeDetailReader,
} from "@/server/application/get-loose-pledge-detail";
import { Money } from "@/server/domain/money";
import type { LoosePledgeDetail } from "@/server/domain/loose-pledge";

function createInMemoryReader(pledge: LoosePledgeDetail | null): LoosePledgeDetailReader {
  return {
    findById() {
      return Promise.resolve(pledge);
    },
  };
}

describe("getLoosePledgeDetail", () => {
  it("retorna o carnê avulso com as contribuições", async () => {
    const pledge: LoosePledgeDetail = {
      id: "loose-pledge-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Avulso",
      status: "open",
      contributions: [
        {
          id: "contribution-1",
          amount: Money.fromReais(50),
          date: new Date("2026-03-10"),
          paymentMethod: "pix",
          receivedByLabel: "user1@example.com",
          registeredByLabel: "user1@example.com",
        },
      ],
    };
    const reader = createInMemoryReader(pledge);

    const result = await getLoosePledgeDetail(reader, "loose-pledge-1");

    expect(result).toEqual(pledge);
  });

  it("retorna null quando o carnê avulso não existe", async () => {
    const reader = createInMemoryReader(null);

    const result = await getLoosePledgeDetail(reader, "loose-pledge-1");

    expect(result).toBeNull();
  });
});
