import { describe, expect, it } from "vitest";
import {
  archiveTransactionCategory,
  restoreTransactionCategory,
  type TransactionCategoryArchiveRepository,
} from "@/server/application/archive-transaction-category";

function createInMemoryTransactionCategoryArchiveRepository(): TransactionCategoryArchiveRepository & {
  calls: { id: string; active: boolean }[];
} {
  const calls: { id: string; active: boolean }[] = [];
  return {
    calls,
    setActive(id, active) {
      calls.push({ id, active });
      return Promise.resolve();
    },
  };
}

describe("archiveTransactionCategory", () => {
  it("marca a categoria como inativa", async () => {
    const repository = createInMemoryTransactionCategoryArchiveRepository();

    await archiveTransactionCategory(repository, "category-1");

    expect(repository.calls).toEqual([{ id: "category-1", active: false }]);
  });
});

describe("restoreTransactionCategory", () => {
  it("marca a categoria como ativa novamente", async () => {
    const repository = createInMemoryTransactionCategoryArchiveRepository();

    await restoreTransactionCategory(repository, "category-1");

    expect(repository.calls).toEqual([{ id: "category-1", active: true }]);
  });
});
