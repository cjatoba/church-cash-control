import { z } from "zod";

const transactionCategoryTypes = ["income", "expense"] as const;

export type TransactionCategoryType = (typeof transactionCategoryTypes)[number];

const transactionCategoryInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Campanha é obrigatória"),
  name: z.string().trim().min(1, "Nome da categoria é obrigatório"),
  type: z.enum(transactionCategoryTypes),
});

export interface TransactionCategory {
  campaignId: string;
  name: string;
  type: TransactionCategoryType;
}

export interface TransactionCategorySummary extends TransactionCategory {
  id: string;
  active: boolean;
}

export function parseTransactionCategory(input: unknown): TransactionCategory {
  return transactionCategoryInputSchema.parse(input);
}
