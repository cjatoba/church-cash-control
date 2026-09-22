import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { parseInvite } from "../domain/user-invite";
import type { UserCapabilities } from "../domain/user-capabilities";

export interface InviteUserRepository {
  phoneInUse(phone: string): Promise<boolean>;
  create(
    input: {
      phone: string;
      passwordHash: string;
    } & UserCapabilities,
  ): Promise<{ id: string }>;
}

export interface InviteUserDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
  loginUrl: string;
}

export interface InvitedUser extends UserCapabilities {
  id: string;
  phone: string;
  temporaryPassword: string;
  whatsappLink: string;
}

export async function inviteUser(
  repository: InviteUserRepository,
  dependencies: InviteUserDependencies,
  input: unknown,
): Promise<InvitedUser> {
  const invite = parseInvite(input);

  if (await repository.phoneInUse(invite.phone)) {
    throw new Error("Celular já cadastrado");
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  const { id } = await repository.create({ ...invite, passwordHash });

  return {
    id,
    phone: invite.phone,
    canManageUsers: invite.canManageUsers,
    canManageCampaigns: invite.canManageCampaigns,
    canReceiveFunds: invite.canReceiveFunds,
    temporaryPassword,
    whatsappLink: buildTemporaryPasswordWhatsAppLink(
      invite.phone,
      temporaryPassword,
      dependencies.loginUrl,
    ),
  };
}
