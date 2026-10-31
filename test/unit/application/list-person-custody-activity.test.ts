import { describe, expect, it } from "vitest";
import {
  listPersonCustodyActivity,
  type PersonCustodyActivityReader,
} from "@/server/application/list-person-custody-activity";
import { Money } from "@/server/domain/money";

const reader: PersonCustodyActivityReader = {
  findReceivedEntries() {
    return Promise.resolve([
      {
        kind: "installment",
        id: "i1",
        sourceId: "pledge-1",
        donorLabel: "Maria Souza",
        amount: Money.fromReais(50),
        date: new Date("2026-08-30"),
        paymentMethod: "cash",
        registeredByLabel: "Carlos",
        dueDate: new Date("2026-08-01"),
      },
      {
        kind: "one_off_donation",
        id: "d1",
        sourceId: null,
        donorLabel: null,
        amount: Money.fromReais(5000),
        date: new Date("2026-09-17"),
        paymentMethod: "pix",
        registeredByLabel: "Ana",
        dueDate: null,
      },
      {
        kind: "volunteer_transfer",
        id: "v1",
        sourceId: null,
        donorLabel: "Bruno",
        amount: Money.fromReais(200),
        date: new Date("2026-09-20"),
        paymentMethod: null,
        registeredByLabel: "Bruno",
        dueDate: null,
      },
    ]);
  },
  findTransfersFrom() {
    return Promise.resolve([
      {
        id: "t1",
        recipientName: "Tesouraria",
        toVolunteer: false,
        amount: Money.fromReais(30),
        transferDate: new Date("2026-09-01"),
        registeredByLabel: "Carlos",
      },
    ]);
  },
};

describe("listPersonCustodyActivity", () => {
  it("lista de onde veio cada valor e cada repasse, do mais recente para o mais antigo, com os totais", async () => {
    const activity = await listPersonCustodyActivity(reader, "campaign-1", "user-1");

    expect(activity.received.map((entry) => entry.id)).toEqual(["v1", "d1", "i1"]);
    expect(activity.transfers.map((transfer) => transfer.id)).toEqual(["t1"]);
    expect(activity.receivedTotal.toCents()).toBe(525_000);
    expect(activity.transferredTotal.toCents()).toBe(3_000);
    expect(activity.balance.toCents()).toBe(522_000);
  });
});
