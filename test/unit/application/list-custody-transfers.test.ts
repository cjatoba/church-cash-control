import { describe, expect, it } from "vitest";
import {
  listCustodyTransfers,
  type CustodyTransferListReader,
  type CustodyTransferSummary,
} from "@/server/application/list-custody-transfers";
import { Money } from "@/server/domain/money";

function createInMemoryReader(transfers: CustodyTransferSummary[]): CustodyTransferListReader {
  return {
    findByCampaign() {
      return Promise.resolve(transfers);
    },
  };
}

describe("listCustodyTransfers", () => {
  it("retorna os repasses registrados na campanha", async () => {
    const transfer: CustodyTransferSummary = {
      id: "transfer-1",
      fromUserLabel: "clayton@example.com",
      recipientName: "Responsável pela compra",
      amount: Money.fromReais(100),
      transferDate: new Date("2026-03-10"),
      registeredByUserLabel: "clayton@example.com",
    };
    const reader = createInMemoryReader([transfer]);

    const result = await listCustodyTransfers(reader, "campaign-1");

    expect(result).toEqual([transfer]);
  });

  it("retorna lista vazia quando não há repasses registrados", async () => {
    const reader = createInMemoryReader([]);

    const result = await listCustodyTransfers(reader, "campaign-1");

    expect(result).toEqual([]);
  });
});
