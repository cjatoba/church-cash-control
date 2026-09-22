import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { canRegenerateTemporaryPassword } from "../domain/temporary-password-reset";

export interface RegenerateTemporaryPasswordRepository {
  findById(userId: string): Promise<{
    id: string;
    phone: string;
    active: boolean;
  } | null>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export interface RegenerateTemporaryPasswordDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
  loginUrl: string;
}

export interface RegeneratedTemporaryPassword {
  phone: string;
  temporaryPassword: string;
  whatsappLink: string;
}

export async function regenerateTemporaryPassword(
  repository: RegenerateTemporaryPasswordRepository,
  dependencies: RegenerateTemporaryPasswordDependencies,
  userId: string,
): Promise<RegeneratedTemporaryPassword> {
  const user = await repository.findById(userId);
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  if (!canRegenerateTemporaryPassword(user)) {
    throw new Error("Usuário desativado; não é possível gerar uma nova senha temporária");
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  await repository.updatePasswordHash(userId, passwordHash);

  return {
    phone: user.phone,
    temporaryPassword,
    whatsappLink: buildTemporaryPasswordWhatsAppLink(
      user.phone,
      temporaryPassword,
      dependencies.loginUrl,
    ),
  };
}
