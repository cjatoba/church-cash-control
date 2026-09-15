import { eq } from "drizzle-orm";
import type { UserListRepository } from "@/server/application/list-users";
import type { UserCapabilities } from "@/server/domain/user-capabilities";
import type { DbClient } from "./client";
import { users } from "./schema";

export interface UserRecord extends UserCapabilities {
  id: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
}

export async function findUserByEmail(db: DbClient, email: string): Promise<UserRecord | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      mustChangePassword: users.mustChangePassword,
      canManageUsers: users.canManageUsers,
      canManageCampaigns: users.canManageCampaigns,
      canReceiveFunds: users.canReceiveFunds,
      active: users.active,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows[0] ?? null;
}

export async function findPasswordHashById(db: DbClient, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.passwordHash ?? null;
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
