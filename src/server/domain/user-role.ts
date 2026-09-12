import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "fundraiser"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
