import { z } from "zod";

const checkboxSchema = z.preprocess((value) => value === "on" || value === true, z.boolean());

export const userCapabilitiesSchema = z.object({
  canManageUsers: checkboxSchema,
  canManageCampaigns: checkboxSchema,
  canReceiveFunds: checkboxSchema,
});

export type UserCapabilities = z.infer<typeof userCapabilitiesSchema>;

// Impede que a própria pessoa remova a própria capacidade de gerenciar
// usuários ao se editar, evitando se trancar fora da tela de gerenciar
// usuários por engano — as demais capacidades não têm esse risco.
export function resolveCapabilitiesForUpdate(
  actingUserId: string,
  targetUserId: string,
  current: UserCapabilities,
  requested: UserCapabilities,
): UserCapabilities {
  if (actingUserId !== targetUserId) {
    return requested;
  }
  return { ...requested, canManageUsers: current.canManageUsers };
}
