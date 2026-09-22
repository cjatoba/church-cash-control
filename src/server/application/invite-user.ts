import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { parseInvite } from "../domain/user-invite";
import type { UserCapabilities } from "../domain/user-capabilities";

export interface InviteUserRepository {
  phoneInUse(phone: string): Promise<boolean>;
  create(
    input: {
      name: string;
      phone?: string;
      passwordHash?: string;
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
  name: string;
  phone?: string;
  temporaryPassword?: string;
  whatsappLink?: string;
}

export async function inviteUser(
  repository: InviteUserRepository,
  dependencies: InviteUserDependencies,
  input: unknown,
): Promise<InvitedUser> {
  const invite = parseInvite(input);

  if (invite.phone && (await repository.phoneInUse(invite.phone))) {
    throw new Error("Celular já cadastrado");
  }

  if (!invite.phone) {
    const { id } = await repository.create(invite);
    return {
      id,
      name: invite.name,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    };
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  const { id } = await repository.create({ ...invite, passwordHash });

  return {
    id,
    name: invite.name,
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
