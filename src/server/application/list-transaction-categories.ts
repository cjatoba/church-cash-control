import type { TransactionCategorySummary } from "../domain/transaction-category";

export interface TransactionCategoryListRepository {
  findAllByCampaign(campaignId: string): Promise<TransactionCategorySummary[]>;
}

export function listTransactionCategories(
  repository: TransactionCategoryListRepository,
  campaignId: string,
): Promise<TransactionCategorySummary[]> {
  return repository.findAllByCampaign(campaignId);
}
