import type { UserPasswordRepository as ForcedChangeRepository } from "@/server/application/change-password";
import type {
  OwnPasswordReader,
  UserPasswordRepository,
} from "@/server/application/change-own-password";
import type { DbClient } from "./client";
import { completeUserPasswordChange, findPasswordHashById } from "./user-repository";

export function createUserPasswordRepository(
  db: DbClient,
): ForcedChangeRepository & OwnPasswordReader & UserPasswordRepository {
  return {
    completePasswordChange(userId, passwordHash) {
      return completeUserPasswordChange(db, userId, passwordHash);
    },
    findPasswordHash(userId) {
      return findPasswordHashById(db, userId);
    },
  };
}
