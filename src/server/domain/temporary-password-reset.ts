export function canRegenerateTemporaryPassword(user: { active: boolean }): boolean {
  return user.active;
}
