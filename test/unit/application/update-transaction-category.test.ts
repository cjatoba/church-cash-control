import { describe, expect, it } from "vitest";
import {
  updateTransactionCategory,
  type TransactionCategoryUpdateRepository,
} from "@/server/application/update-transaction-category";
import type { TransactionCategory } from "@/server/domain/transaction-category";

function createInMemoryTransactionCategoryUpdateRepository(): TransactionCategoryUpdateRepository & {
  updates: { id: string; category: TransactionCategory }[];
} {
  const updates: { id: string; category: TransactionCategory }[] = [];
  return {
    updates,
    update(id, category) {
      updates.push({ id, category });
      return Promise.resolve();
    },
  };
}

describe("updateTransactionCategory", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    name: "Dízimo",
    type: "income",
  };

  it("atualiza os dados da categoria existente", async () => {
    const repository = createInMemoryTransactionCategoryUpdateRepository();

    await updateTransactionCategory(repository, "category-1", validInput);

    expect(repository.updates).toHaveLength(1);
    expect(repository.updates[0]?.id).toBe("category-1");
    expect(repository.updates[0]?.category.name).toBe("Dízimo");
    expect(repository.updates[0]?.category.type).toBe("income");
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryTransactionCategoryUpdateRepository();

    await expect(
      updateTransactionCategory(repository, "category-1", { ...validInput, name: "" }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });
});
