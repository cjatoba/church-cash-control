import { z } from "zod";
import { optionalPhoneSchema } from "./phone";
import { userCapabilitiesSchema } from "./user-capabilities";

const userEditSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    phone: optionalPhoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserEdit = z.infer<typeof userEditSchema>;

// Mesma regra do convite: sem celular não tem como logar, então nenhuma
// capacidade faz sentido, mesmo que tenha sido marcada no formulário.
export function parseUserEdit(input: unknown): UserEdit {
  const edit = userEditSchema.parse(input);
  if (edit.phone) {
    return edit;
  }
  return {
    ...edit,
    canManageUsers: false,
    canManageCampaigns: false,
    canReceiveFunds: false,
  };
}
