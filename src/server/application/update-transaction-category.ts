import { parseTransactionCategory, type TransactionCategory } from "../domain/transaction-category";

export interface TransactionCategoryUpdateRepository {
  update(id: string, category: TransactionCategory): Promise<void>;
}

export async function updateTransactionCategory(
  repository: TransactionCategoryUpdateRepository,
  id: string,
  input: unknown,
): Promise<void> {
  const category = parseTransactionCategory(input);
  await repository.update(id, category);
}
