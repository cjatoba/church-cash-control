import { describe, expect, it } from "vitest";
import {
  correctLooseContribution,
  correctOneOffDonation,
  deleteLooseContribution,
  deleteOneOffDonation,
  type LooseContributionStore,
  type OneOffDonationStore,
} from "@/server/application/correct-received-entry";
import type { CustodyBalanceReader } from "@/server/application/create-custody-transfer";
import { Money } from "@/server/domain/money";

function balanceReader(receivedCents: number, transferredCents: number): CustodyBalanceReader {
  return { getAvailableBalance: () => Promise.resolve({ receivedCents, transferredCents }) };
}

function createDonationStore() {
  const updates: unknown[] = [];
  const removed: string[] = [];
  const store: OneOffDonationStore = {
    findById(id) {
      return Promise.resolve(
        id === "donation-1"
          ? {
              campaignId: "campaign-1",
              subjectName: "Tesouraria",
              donorId: null,
              fields: {
                donorName: "Tesouraria",
                amount: Money.fromReais(5000),
                date: new Date("2026-08-17"),
                paymentMethod: "pix",
                receivedByUserId: "user-a",
              },
            }
          : null,
      );
    },
    update(id, fields) {
      updates.push({ id, fields });
      return Promise.resolve();
    },
    remove(id) {
      removed.push(id);
      return Promise.resolve();
    },
  };
  return { store, updates, removed };
}

const correctedDonation = {
  donorName: "Tesouraria",
  amount: "5000",
  date: "2026-08-17",
  paymentMethod: "pix",
  receivedByUserId: "user-b",
};

describe("correctOneOffDonation", () => {
  it("passa a entrada para quem de fato recebeu, devolvendo o antes e o depois", async () => {
    const { store, updates } = createDonationStore();

    const result = await correctOneOffDonation(
      { store, balanceReader: balanceReader(500_000, 0) },
      "campaign-1",
      "donation-1",
      correctedDonation,
    );

    expect(updates).toHaveLength(1);
    expect(result.subjectName).toBe("Tesouraria");
    expect(result.before.receivedByUserId).toBe("user-a");
    expect(result.after.receivedByUserId).toBe("user-b");
    expect(result.after.amount.toCents()).toBe(500_000);
  });

  it("não corrige quando quem recebeu já repassou esse dinheiro", async () => {
    const { store, updates } = createDonationStore();

    await expect(
      correctOneOffDonation(
        { store, balanceReader: balanceReader(500_000, 100_000) },
        "campaign-1",
        "donation-1",
        correctedDonation,
      ),
    ).rejects.toThrow("Corrija o repasse primeiro");
    expect(updates).toHaveLength(0);
  });

  it("não acha uma doação de outra campanha", async () => {
    const { store } = createDonationStore();

    await expect(
      correctOneOffDonation(
        { store, balanceReader: balanceReader(500_000, 0) },
        "campaign-2",
        "donation-1",
        correctedDonation,
      ),
    ).rejects.toThrow("Entrada não encontrada");
    await expect(
      correctOneOffDonation(
        { store, balanceReader: balanceReader(500_000, 0) },
        "campaign-1",
        "donation-x",
        correctedDonation,
      ),
    ).rejects.toThrow("Entrada não encontrada");
  });
});

describe("deleteOneOffDonation", () => {
  it("exclui a doação quando o valor ainda está com quem recebeu", async () => {
    const { store, removed } = createDonationStore();

    const deleted = await deleteOneOffDonation(
      { store, balanceReader: balanceReader(500_000, 0) },
      "campaign-1",
      "donation-1",
    );

    expect(removed).toEqual(["donation-1"]);
    expect(deleted.subjectName).toBe("Tesouraria");
    expect(deleted.fields.amount.toCents()).toBe(500_000);
  });

  it("não exclui quando o valor já foi repassado", async () => {
    const { store, removed } = createDonationStore();

    await expect(
      deleteOneOffDonation(
        { store, balanceReader: balanceReader(500_000, 1) },
        "campaign-1",
        "donation-1",
      ),
    ).rejects.toThrow("saldo em mãos");
    expect(removed).toHaveLength(0);
  });
});

function createContributionStore() {
  const updates: unknown[] = [];
  const removed: string[] = [];
  const store: LooseContributionStore = {
    findById() {
      return Promise.resolve({
        campaignId: "campaign-1",
        subjectName: "Rita Gomes",
        donorId: "donor-1",
        fields: {
          amount: Money.fromReais(50),
          date: new Date("2026-09-02"),
          paymentMethod: "pix",
          receivedByUserId: "user-a",
        },
      });
    },
    update(id, fields) {
      updates.push({ id, fields });
      return Promise.resolve();
    },
    remove(id) {
      removed.push(id);
      return Promise.resolve();
    },
  };
  return { store, updates, removed };
}

describe("correctLooseContribution / deleteLooseContribution", () => {
  it("corrige valor e forma de uma entrega de carnê avulso", async () => {
    const { store, updates } = createContributionStore();

    const result = await correctLooseContribution(
      { store, balanceReader: balanceReader(5_000, 0) },
      "campaign-1",
      "contribution-1",
      { amount: "40", date: "2026-09-02", paymentMethod: "cash", receivedByUserId: "user-a" },
    );

    expect(updates).toHaveLength(1);
    expect(result.after.amount.toCents()).toBe(4_000);
    expect(result.after.paymentMethod).toBe("cash");
    expect(result.donorId).toBe("donor-1");
  });

  it("exclui uma entrega lançada por engano", async () => {
    const { store, removed } = createContributionStore();

    await deleteLooseContribution(
      { store, balanceReader: balanceReader(5_000, 0) },
      "campaign-1",
      "contribution-1",
    );

    expect(removed).toEqual(["contribution-1"]);
  });
});
