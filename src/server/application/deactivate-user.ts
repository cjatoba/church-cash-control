import { canDeactivateUser } from "../domain/user-deactivation";

export interface UserActiveRepository {
  setActive(userId: string, active: boolean): Promise<void>;
}

export async function deactivateUser(
  repository: UserActiveRepository,
  actingUserId: string,
  targetUserId: string,
): Promise<void> {
  if (!canDeactivateUser(actingUserId, targetUserId)) {
    throw new Error("Não é possível desativar a própria conta");
  }
  await repository.setActive(targetUserId, false);
}

export function reactivateUser(
  repository: UserActiveRepository,
  targetUserId: string,
): Promise<void> {
  return repository.setActive(targetUserId, true);
}
