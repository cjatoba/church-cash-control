import { eq } from "drizzle-orm";
import type { UserListRepository } from "@/server/application/list-users";
import type { UserCapabilities } from "@/server/domain/user-capabilities";
import type { DbClient } from "./client";
import { users } from "./schema";

export interface UserRecord extends UserCapabilities {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
}

export async function findUserByPhone(db: DbClient, phone: string): Promise<UserRecord | null> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      passwordHash: users.passwordHash,
      mustChangePassword: users.mustChangePassword,
      canManageUsers: users.canManageUsers,
      canManageCampaigns: users.canManageCampaigns,
      canReceiveFunds: users.canReceiveFunds,
      active: users.active,
    })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  const row = rows[0];
  // Quem tem celular sempre tem senha (definidos juntos, no convite ou na
  // ativação de acesso) — passwordHash nulo aqui seria um estado
  // inconsistente, tratado como "não encontrado" em vez de quebrar o login.
  if (!row?.phone || !row.passwordHash) {
    return null;
  }
  return { ...row, phone: row.phone, passwordHash: row.passwordHash };
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
      return db.select({ id: users.id, name: users.name }).from(users);
    },
  };
}
