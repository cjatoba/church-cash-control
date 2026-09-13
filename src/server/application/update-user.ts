import { parseUserEdit } from "../domain/user-edit";
import { resolveCapabilitiesForUpdate } from "../domain/user-capabilities";
import type { UserCapabilities } from "../domain/user-capabilities";

export interface UpdateUserRepository {
  findUserForEdit(userId: string): Promise<
    | ({
        id: string;
        email: string;
        phone: string | null;
      } & UserCapabilities)
    | null
  >;
  emailInUseByAnotherUser(email: string, userId: string): Promise<boolean>;
  update(
    userId: string,
    input: { email: string; phone?: string } & UserCapabilities,
  ): Promise<void>;
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

  const capabilities = resolveCapabilitiesForUpdate(actingUserId, targetUserId, current, edit);

  await repository.update(targetUserId, { email: edit.email, phone: edit.phone, ...capabilities });
}
