import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { parseUserActivation } from "../domain/user-activation";
import type { UserCapabilities } from "../domain/user-capabilities";

export interface ActivateUserAccessRepository {
  findUserForEdit(userId: string): Promise<
    | ({
        id: string;
        name: string;
        phone: string | null;
      } & UserCapabilities)
    | null
  >;
  phoneInUse(phone: string): Promise<boolean>;
  activate(
    userId: string,
    input: { phone: string; passwordHash: string } & UserCapabilities,
  ): Promise<void>;
}

export interface ActivateUserAccessDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
  loginUrl: string;
}

export interface ActivatedUserAccess {
  phone: string;
  temporaryPassword: string;
  whatsappLink: string;
}

export async function activateUserAccess(
  repository: ActivateUserAccessRepository,
  dependencies: ActivateUserAccessDependencies,
  userId: string,
  input: unknown,
): Promise<ActivatedUserAccess> {
  const current = await repository.findUserForEdit(userId);
  if (!current) {
    throw new Error("Usuário não encontrado");
  }
  if (current.phone) {
    throw new Error("Usuário já tem acesso ao sistema");
  }

  const activation = parseUserActivation(input);
  if (await repository.phoneInUse(activation.phone)) {
    throw new Error("Celular já cadastrado");
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  await repository.activate(userId, { ...activation, passwordHash });

  return {
    phone: activation.phone,
    temporaryPassword,
    whatsappLink: buildTemporaryPasswordWhatsAppLink(
      activation.phone,
      temporaryPassword,
      dependencies.loginUrl,
    ),
  };
}
