import { parseUserEdit } from "../domain/user-edit";
import { resolveCapabilitiesForUpdate } from "../domain/user-capabilities";
import type { UserCapabilities } from "../domain/user-capabilities";

export interface UpdateUserRepository {
  findUserForEdit(userId: string): Promise<
    | ({
        id: string;
        phone: string;
      } & UserCapabilities)
    | null
  >;
  phoneInUseByAnotherUser(phone: string, userId: string): Promise<boolean>;
  update(userId: string, input: { phone: string } & UserCapabilities): Promise<void>;
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
    edit.phone !== current.phone &&
    (await repository.phoneInUseByAnotherUser(edit.phone, targetUserId))
  ) {
    throw new Error("Celular já cadastrado");
  }

  const capabilities = resolveCapabilitiesForUpdate(actingUserId, targetUserId, current, edit);

  await repository.update(targetUserId, { phone: edit.phone, ...capabilities });
}
