import { parseNewPassword } from "../domain/change-password";

export interface UserPasswordRepository {
  completePasswordChange(userId: string, passwordHash: string): Promise<void>;
}

export async function changePassword(
  repository: UserPasswordRepository,
  hashPassword: (password: string) => Promise<string>,
  userId: string,
  input: unknown,
): Promise<void> {
  const { newPassword } = parseNewPassword(input);
  const passwordHash = await hashPassword(newPassword);
  await repository.completePasswordChange(userId, passwordHash);
}
