import { buildTemporaryPasswordWhatsAppLink } from "../domain/invite-message";
import { canRegenerateTemporaryPassword } from "../domain/temporary-password-reset";

export interface RegenerateTemporaryPasswordRepository {
  findById(userId: string): Promise<{
    id: string;
    name: string;
    phone: string | null;
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
  name: string;
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
    throw new Error(
      "Usuário desativado ou sem acesso ao sistema; não é possível gerar uma nova senha temporária",
    );
  }

  const temporaryPassword = dependencies.generateTemporaryPassword();
  const passwordHash = await dependencies.hashPassword(temporaryPassword);
  await repository.updatePasswordHash(userId, passwordHash);

  return {
    name: user.name,
    phone: user.phone,
    temporaryPassword,
    whatsappLink: buildTemporaryPasswordWhatsAppLink(
      user.phone,
      temporaryPassword,
      dependencies.loginUrl,
    ),
  };
}
