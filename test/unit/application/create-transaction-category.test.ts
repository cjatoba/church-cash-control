import { describe, expect, it } from "vitest";
import {
  createTransactionCategory,
  type TransactionCategoryRepository,
} from "@/server/application/create-transaction-category";
import type { TransactionCategory } from "@/server/domain/transaction-category";

function createInMemoryTransactionCategoryRepository(): TransactionCategoryRepository & {
  saved: TransactionCategory[];
} {
  const saved: TransactionCategory[] = [];
  return {
    saved,
    create(category) {
      saved.push(category);
      return Promise.resolve({ id: `category-${String(saved.length)}` });
    },
  };
}

describe("createTransactionCategory", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    name: "Dízimo",
    type: "income",
  };

  it("persiste a categoria válida e retorna o id gerado", async () => {
    const repository = createInMemoryTransactionCategoryRepository();

    const result = await createTransactionCategory(repository, validInput);

    expect(result.id).toBe("category-1");
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.name).toBe("Dízimo");
    expect(repository.saved[0]?.campaignId).toBe(validInput.campaignId);
    expect(repository.saved[0]?.type).toBe("income");
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryTransactionCategoryRepository();

    await expect(
      createTransactionCategory(repository, { ...validInput, name: "" }),
    ).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
