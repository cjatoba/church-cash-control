import { z } from "zod";
import { optionalPhoneSchema } from "./phone";
import { userCapabilitiesSchema } from "./user-capabilities";

const userInviteSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    phone: optionalPhoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserInvite = z.infer<typeof userInviteSchema>;

// Sem celular, o voluntário não consegue logar — nenhuma capacidade faz
// sentido nesse caso, mesmo que tenha sido marcada no formulário.
export function parseInvite(input: unknown): UserInvite {
  const invite = userInviteSchema.parse(input);
  if (invite.phone) {
    return invite;
  }
  return {
    ...invite,
    canManageUsers: false,
    canManageCampaigns: false,
    canReceiveFunds: false,
  };
}
