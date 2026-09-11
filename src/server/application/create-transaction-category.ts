import { parseTransactionCategory, type TransactionCategory } from "../domain/transaction-category";

export interface TransactionCategoryRepository {
  create(category: TransactionCategory): Promise<{ id: string }>;
}

export async function createTransactionCategory(
  repository: TransactionCategoryRepository,
  input: unknown,
): Promise<{ id: string }> {
  const category = parseTransactionCategory(input);
  return repository.create(category);
}
