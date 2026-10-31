import { describe, expect, it } from "vitest";
import {
  correctCustodyTransfer,
  deleteCustodyTransfer,
  type CustodyTransferStore,
} from "@/server/application/correct-custody-transfer";
import type { CustodyBalanceReader } from "@/server/application/create-custody-transfer";
import { Money } from "@/server/domain/money";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";

function createDependencies(balanceByUser: Record<string, number>) {
  const updates: unknown[] = [];
  const removed: string[] = [];
  const store: CustodyTransferStore = {
    findById(id) {
      if (id === "transfer-1") {
        return Promise.resolve({
          campaignId: "campaign-1",
          subjectName: "Tesouraria",
          donorId: null,
          fields: {
            fromUserId: "user-a",
            toUserId: null,
            recipientName: "Tesouraria",
            amount: Money.fromReais(200),
            transferDate: new Date("2026-10-20"),
            description: null,
          },
        });
      }
      if (id === "transfer-to-volunteer") {
        return Promise.resolve({
          campaignId: "campaign-1",
          subjectName: "user-a para user-b",
          donorId: null,
          fields: {
            fromUserId: "user-a",
            toUserId: "user-b",
            recipientName: null,
            amount: Money.fromReais(200),
            transferDate: new Date("2026-10-20"),
            description: null,
          },
        });
      }
      return Promise.resolve(null);
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

  it("não deixa trocar o voluntário que recebeu se ele já passou o dinheiro adiante", async () => {
    const { dependencies, updates } = createDependencies({ "user-a": 0, "user-b": 5_000 });

    const attempt = correctCustodyTransfer(
      dependencies,
      "campaign-1",
      "transfer-to-volunteer",
      { ...input, recipientName: "", toUserId: "user-c", amount: "200" },
      today,
    );

    await expect(attempt).rejects.toThrow(FundsAlreadyTransferredError);
    await expect(attempt).rejects.toThrow(expect.objectContaining({ receiverUserId: "user-b" }));
    expect(updates).toHaveLength(0);
  });

  it("aceita trocar o voluntário que recebeu enquanto o dinheiro ainda está com ele", async () => {
    const { dependencies, updates } = createDependencies({ "user-a": 0, "user-b": 20_000 });

    const result = await correctCustodyTransfer(
      dependencies,
      "campaign-1",
      "transfer-to-volunteer",
      { ...input, recipientName: "", toUserId: "user-c", amount: "200" },
      today,
    );

    expect(updates).toHaveLength(1);
    expect(result.after.toUserId).toBe("user-c");
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

  it("não exclui o repasse para um voluntário que já passou o dinheiro adiante", async () => {
    const { dependencies, removed } = createDependencies({ "user-b": 5_000 });

    await expect(
      deleteCustodyTransfer(dependencies, "campaign-1", "transfer-to-volunteer"),
    ).rejects.toThrow(FundsAlreadyTransferredError);
    expect(removed).toHaveLength(0);
  });

  it("exclui o repasse para um voluntário enquanto o dinheiro ainda está com ele", async () => {
    const { dependencies, removed } = createDependencies({ "user-b": 20_000 });

    await deleteCustodyTransfer(dependencies, "campaign-1", "transfer-to-volunteer");

    expect(removed).toEqual(["transfer-to-volunteer"]);
  });

  it("rejeita repasse inexistente", async () => {
    const { dependencies } = createDependencies({});

    await expect(deleteCustodyTransfer(dependencies, "campaign-1", "x")).rejects.toThrow(
      "Repasse não encontrado",
    );
  });
});
