import { eq } from "drizzle-orm";
import type { TransactionCategoryRepository } from "@/server/application/create-transaction-category";
import type { TransactionCategoryListRepository } from "@/server/application/list-transaction-categories";
import type { TransactionCategoryUpdateRepository } from "@/server/application/update-transaction-category";
import type { TransactionCategoryArchiveRepository } from "@/server/application/archive-transaction-category";
import type { TransactionCategoryDetailRepository } from "@/server/application/get-transaction-category";
import type { DbClient } from "./client";
import { transactionCategories } from "./schema";

export function createTransactionCategoryRepository(
  db: DbClient,
): TransactionCategoryRepository &
  TransactionCategoryListRepository &
  TransactionCategoryUpdateRepository &
  TransactionCategoryArchiveRepository &
  TransactionCategoryDetailRepository {
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

    async findAllByCampaign(campaignId) {
      const rows = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.campaignId, campaignId));

      return rows.map((row) => ({
        id: row.id,
        campaignId: row.campaignId,
        name: row.name,
        type: row.type,
        active: row.active,
      }));
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, id))
        .limit(1);

      if (!row) {
        return null;
      }
      return {
        campaignId: row.campaignId,
        name: row.name,
        type: row.type,
        active: row.active,
      };
    },

    async update(id, category) {
      await db
        .update(transactionCategories)
        .set({ name: category.name, type: category.type })
        .where(eq(transactionCategories.id, id));
    },

    async setActive(id, active) {
      await db
        .update(transactionCategories)
        .set({ active })
        .where(eq(transactionCategories.id, id));
    },
  };
}
