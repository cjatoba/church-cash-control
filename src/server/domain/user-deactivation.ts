export function canDeactivateUser(actingUserId: string, targetUserId: string): boolean {
  return actingUserId !== targetUserId;
}
