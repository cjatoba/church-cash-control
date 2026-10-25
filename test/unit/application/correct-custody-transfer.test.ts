import { describe, expect, it } from "vitest";
import {
  correctCustodyTransfer,
  deleteCustodyTransfer,
  type CustodyTransferStore,
} from "@/server/application/correct-custody-transfer";
import type { CustodyBalanceReader } from "@/server/application/create-custody-transfer";
import { Money } from "@/server/domain/money";

function createDependencies(balanceByUser: Record<string, number>) {
  const updates: unknown[] = [];
  const removed: string[] = [];
  const store: CustodyTransferStore = {
    findById(id) {
      return Promise.resolve(
        id === "transfer-1"
          ? {
              campaignId: "campaign-1",
              subjectName: "Tesouraria",
              donorId: null,
              fields: {
                fromUserId: "user-a",
                recipientName: "Tesouraria",
                amount: Money.fromReais(200),
                transferDate: new Date("2026-10-20"),
                description: null,
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
  const balanceReader: CustodyBalanceReader = {
    getAvailableBalance: (_campaignId, userId) =>
      Promise.resolve({ receivedCents: balanceByUser[userId] ?? 0, transferredCents: 0 }),
  };
  return { dependencies: { store, balanceReader }, updates, removed };
}

const today = new Date("2026-10-25");
const input = {
  fromUserId: "user-a",
  recipientName: "Tesouraria",
  amount: "250",
  transferDate: "2026-10-20",
  description: "",
};

describe("correctCustodyTransfer", () => {
  it("aceita aumentar o repasse até o saldo mais o valor original", async () => {
    const { dependencies, updates } = createDependencies({ "user-a": 5_000 });

    const result = await correctCustodyTransfer(
      dependencies,
      "campaign-1",
      "transfer-1",
      input,
      today,
    );

    expect(updates).toHaveLength(1);
    expect(result.before.amount.toCents()).toBe(20_000);
    expect(result.after.amount.toCents()).toBe(25_000);
  });

  it("rejeita quando quem passa a constar como remetente não tem esse saldo", async () => {
    const { dependencies, updates } = createDependencies({ "user-a": 100_000, "user-b": 1_000 });

    await expect(
      correctCustodyTransfer(
        dependencies,
        "campaign-1",
        "transfer-1",
        { ...input, fromUserId: "user-b" },
        today,
      ),
    ).rejects.toThrow("saldo disponível");
    expect(updates).toHaveLength(0);
  });

  it("rejeita repasse de outra campanha", async () => {
    const { dependencies } = createDependencies({});

    await expect(
      correctCustodyTransfer(dependencies, "campaign-2", "transfer-1", input, today),
    ).rejects.toThrow("Repasse não encontrado");
  });
});

describe("deleteCustodyTransfer", () => {
  it("exclui o repasse, devolvendo o valor para o saldo de quem repassou", async () => {
    const { dependencies, removed } = createDependencies({});

    const deleted = await deleteCustodyTransfer(dependencies, "campaign-1", "transfer-1");

    expect(removed).toEqual(["transfer-1"]);
    expect(deleted.fields.recipientName).toBe("Tesouraria");
  });

  it("rejeita repasse inexistente", async () => {
    const { dependencies } = createDependencies({});

    await expect(deleteCustodyTransfer(dependencies, "campaign-1", "x")).rejects.toThrow(
      "Repasse não encontrado",
    );
  });
});
