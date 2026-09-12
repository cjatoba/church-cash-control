import { describe, expect, it } from "vitest";
import {
  listTransactionCategories,
  type TransactionCategoryListRepository,
} from "@/server/application/list-transaction-categories";
import type { TransactionCategorySummary } from "@/server/domain/transaction-category";

function createInMemoryTransactionCategoryListRepository(
  categories: TransactionCategorySummary[],
): TransactionCategoryListRepository {
  return {
    findAllByCampaign() {
      return Promise.resolve(categories);
    },
  };
}

describe("listTransactionCategories", () => {
  it("retorna as categorias cadastradas para a campanha", async () => {
    const category: TransactionCategorySummary = {
      id: "category-1",
      campaignId: "campaign-1",
      name: "Dízimo",
      type: "income",
      active: true,
    };
    const repository = createInMemoryTransactionCategoryListRepository([category]);

    const result = await listTransactionCategories(repository, "campaign-1");

    expect(result).toEqual([category]);
  });

  it("retorna lista vazia quando não há categorias cadastradas", async () => {
    const repository = createInMemoryTransactionCategoryListRepository([]);

    const result = await listTransactionCategories(repository, "campaign-1");

    expect(result).toEqual([]);
  });
});
