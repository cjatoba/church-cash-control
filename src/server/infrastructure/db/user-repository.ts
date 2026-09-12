import { eq } from "drizzle-orm";
import type { UserListRepository } from "@/server/application/list-users";
import type { DbClient } from "./client";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
}

export async function findUserByEmail(db: DbClient, email: string): Promise<UserRecord | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows[0] ?? null;
}

export async function completeUserPasswordChange(
  db: DbClient,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(users.id, userId));
}

export function createUserListRepository(db: DbClient): UserListRepository {
  return {
    async findAll() {
      return db.select({ id: users.id, email: users.email }).from(users);
    },
  };
}
