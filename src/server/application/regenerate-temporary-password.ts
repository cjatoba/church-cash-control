import { buildAccessWhatsAppLink } from "../domain/invite-message";
import { canRegenerateTemporaryPassword } from "../domain/temporary-password-reset";

export interface RegenerateTemporaryPasswordRepository {
  findById(userId: string): Promise<{
    id: string;
    name: string;
    phone: string | null;
    active: boolean;
    passwordSetByUser: boolean;
  } | null>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export interface RegenerateTemporaryPasswordDependencies {
  generateTemporaryPassword: () => string;
  hashPassword: (password: string) => Promise<string>;
  loginUrl: string;
  appName: string;
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
    whatsappLink: buildAccessWhatsAppLink({
      // Quem nunca criou a própria senha ainda está no primeiro acesso (ex.:
      // o convite original não chegou a ser enviado): recebe o convite, não
      // o aviso de "senha redefinida".
      kind: user.passwordSetByUser ? "password-reset" : "invite",
      name: user.name,
      phone: user.phone,
      appName: dependencies.appName,
      temporaryPassword: temporaryPassword,
      loginUrl: dependencies.loginUrl,
    }),
  };
}
