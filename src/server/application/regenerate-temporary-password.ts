import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { canRegenerateTemporaryPassword } from "../domain/temporary-password-reset";

export interface RegenerateTemporaryPasswordRepository {
  findById(userId: string): Promise<{
    id: string;
    email: string;
    phone: string | null;
    mustChangePassword: boolean;
  } | null>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export interface RegenerateTemporaryPasswordDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
}

export interface RegeneratedTemporaryPassword {
  email: string;
  phone: string | null;
  temporaryPassword: string;
  whatsappLink?: string;
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
    throw new Error("Usuário já trocou a senha; não é possível gerar uma nova temporária");
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  await repository.updatePasswordHash(userId, passwordHash);

  return {
    email: user.email,
    phone: user.phone,
    temporaryPassword,
    whatsappLink: user.phone
      ? buildTemporaryPasswordWhatsAppLink(user.phone, user.email, temporaryPassword)
      : undefined,
  };
}
