import { describe, expect, it } from "vitest";
import {
  getTransactionCategory,
  type TransactionCategoryDetailRepository,
} from "@/server/application/get-transaction-category";
import type { TransactionCategoryDetail } from "@/server/application/get-transaction-category";

function createInMemoryTransactionCategoryDetailRepository(
  category: TransactionCategoryDetail | null,
): TransactionCategoryDetailRepository {
  return {
    findById() {
      return Promise.resolve(category);
    },
  };
}

describe("getTransactionCategory", () => {
  it("retorna os dados da categoria quando ela existe", async () => {
    const category: TransactionCategoryDetail = {
      campaignId: "campaign-1",
      name: "Dízimo",
      type: "income",
      active: true,
    };
    const repository = createInMemoryTransactionCategoryDetailRepository(category);

    const result = await getTransactionCategory(repository, "category-1");

    expect(result).toEqual(category);
  });

  it("retorna null quando a categoria não existe", async () => {
    const repository = createInMemoryTransactionCategoryDetailRepository(null);

    const result = await getTransactionCategory(repository, "category-1");

    expect(result).toBeNull();
  });
});
