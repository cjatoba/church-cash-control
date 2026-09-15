import { parseChangeOwnPasswordInput } from "../domain/change-password";

export interface OwnPasswordReader {
  findPasswordHash(userId: string): Promise<string | null>;
}

export interface UserPasswordRepository {
  completePasswordChange(userId: string, passwordHash: string): Promise<void>;
}

export interface ChangeOwnPasswordDependencies {
  passwordReader: OwnPasswordReader;
  repository: UserPasswordRepository;
  verifyPassword: (plainPassword: string, passwordHash: string) => Promise<boolean>;
  hashPassword: (plainPassword: string) => Promise<string>;
}

export async function changeOwnPassword(
  dependencies: ChangeOwnPasswordDependencies,
  userId: string,
  input: unknown,
): Promise<void> {
  const { currentPassword, newPassword } = parseChangeOwnPasswordInput(input);

  const currentPasswordHash = await dependencies.passwordReader.findPasswordHash(userId);
  if (!currentPasswordHash) {
    throw new Error("Usuário não encontrado");
  }

  const currentPasswordMatches = await dependencies.verifyPassword(
    currentPassword,
    currentPasswordHash,
  );
  if (!currentPasswordMatches) {
    throw new Error("Senha atual incorreta");
  }

  const passwordHash = await dependencies.hashPassword(newPassword);
  await dependencies.repository.completePasswordChange(userId, passwordHash);
}
