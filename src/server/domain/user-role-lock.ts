import type { UserRole } from "./user-role";

// Impede que a própria pessoa mude seu papel ao se editar, evitando que um
// admin se tranque fora da tela de gerenciar usuários por engano.
export function resolveRoleForUpdate(
  actingUserId: string,
  targetUserId: string,
  currentRole: UserRole,
  requestedRole: UserRole,
): UserRole {
  return actingUserId === targetUserId ? currentRole : requestedRole;
}
