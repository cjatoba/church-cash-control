import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { parseInvite } from "../domain/user-invite";
import type { UserRole } from "../domain/user-role";

export interface InviteUserRepository {
  emailInUse(email: string): Promise<boolean>;
  create(input: {
    email: string;
    phone?: string;
    role: UserRole;
    passwordHash: string;
  }): Promise<{ id: string }>;
}

export interface InviteUserDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
  loginUrl: string;
}

export interface InvitedUser {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  temporaryPassword: string;
  whatsappLink?: string;
}

export async function inviteUser(
  repository: InviteUserRepository,
  dependencies: InviteUserDependencies,
  input: unknown,
): Promise<InvitedUser> {
  const invite = parseInvite(input);

  if (await repository.emailInUse(invite.email)) {
    throw new Error("E-mail já cadastrado");
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  const { id } = await repository.create({ ...invite, passwordHash });

  return {
    id,
    email: invite.email,
    phone: invite.phone,
    role: invite.role,
    temporaryPassword,
    whatsappLink: invite.phone
      ? buildTemporaryPasswordWhatsAppLink(
          invite.phone,
          invite.email,
          temporaryPassword,
          dependencies.loginUrl,
        )
      : undefined,
  };
}
