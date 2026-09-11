import type { UserPasswordRepository } from "@/server/application/change-password";
import type { DbClient } from "./client";
import { completeUserPasswordChange } from "./user-repository";

export function createUserPasswordRepository(db: DbClient): UserPasswordRepository {
  return {
    completePasswordChange(userId, passwordHash) {
      return completeUserPasswordChange(db, userId, passwordHash);
    },
  };
}
