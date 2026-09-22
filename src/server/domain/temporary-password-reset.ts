export function canRegenerateTemporaryPassword(user: {
  active: boolean;
  phone: string | null;
}): user is { active: boolean; phone: string } {
  return user.active && user.phone !== null;
}
