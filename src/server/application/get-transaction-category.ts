import type { TransactionCategory } from "../domain/transaction-category";

export interface TransactionCategoryDetail extends TransactionCategory {
  active: boolean;
}

export interface TransactionCategoryDetailRepository {
  findById(id: string): Promise<TransactionCategoryDetail | null>;
}

export function getTransactionCategory(
  repository: TransactionCategoryDetailRepository,
  id: string,
): Promise<TransactionCategoryDetail | null> {
  return repository.findById(id);
}
