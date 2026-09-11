import type { TransactionCategoryRepository } from "@/server/application/create-transaction-category";
import type { DbClient } from "./client";
import { transactionCategories } from "./schema";

export function createTransactionCategoryRepository(db: DbClient): TransactionCategoryRepository {
  return {
    async create(category) {
      const [row] = await db
        .insert(transactionCategories)
        .values({
          campaignId: category.campaignId,
          name: category.name,
          type: category.type,
        })
        .returning({ id: transactionCategories.id });

      if (!row) {
        throw new Error("Falha ao criar categoria");
      }
      return row;
    },
  };
}
