export interface TransactionCategoryArchiveRepository {
  setActive(id: string, active: boolean): Promise<void>;
}

export function archiveTransactionCategory(
  repository: TransactionCategoryArchiveRepository,
  id: string,
): Promise<void> {
  return repository.setActive(id, false);
}

export function restoreTransactionCategory(
  repository: TransactionCategoryArchiveRepository,
  id: string,
): Promise<void> {
  return repository.setActive(id, true);
}
