import { parseUserEdit } from "../domain/user-edit";
import { resolveRoleForUpdate } from "../domain/user-role-lock";
import type { UserRole } from "../domain/user-role";

export interface UpdateUserRepository {
  findUserForEdit(userId: string): Promise<{
    id: string;
    email: string;
    phone: string | null;
    role: UserRole;
  } | null>;
  emailInUseByAnotherUser(email: string, userId: string): Promise<boolean>;
  update(userId: string, input: { email: string; phone?: string; role: UserRole }): Promise<void>;
}

export async function updateUser(
  repository: UpdateUserRepository,
  actingUserId: string,
  targetUserId: string,
  input: unknown,
): Promise<void> {
  const current = await repository.findUserForEdit(targetUserId);
  if (!current) {
    throw new Error("Usuário não encontrado");
  }

  const edit = parseUserEdit(input);

  if (
    edit.email !== current.email &&
    (await repository.emailInUseByAnotherUser(edit.email, targetUserId))
  ) {
    throw new Error("E-mail já cadastrado");
  }

  const role = resolveRoleForUpdate(actingUserId, targetUserId, current.role, edit.role);

  await repository.update(targetUserId, { email: edit.email, phone: edit.phone, role });
}
