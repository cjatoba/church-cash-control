export function canRegenerateTemporaryPassword(user: { mustChangePassword: boolean }): boolean {
  return user.mustChangePassword;
}
