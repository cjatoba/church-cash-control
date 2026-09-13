import { and, eq, ne } from "drizzle-orm";
import type { UserActiveRepository } from "@/server/application/deactivate-user";
import type { InviteUserRepository } from "@/server/application/invite-user";
import type { ManagedUserListRepository } from "@/server/application/list-managed-users";
import type { RegenerateTemporaryPasswordRepository } from "@/server/application/regenerate-temporary-password";
import type { UpdateUserRepository } from "@/server/application/update-user";
import type { DbClient } from "./client";
import { users } from "./schema";

export function createUserManagementRepository(
  db: DbClient,
): InviteUserRepository &
  ManagedUserListRepository &
  RegenerateTemporaryPasswordRepository &
  UserActiveRepository &
  UpdateUserRepository {
  return {
    async emailInUse(email) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return rows.length > 0;
    },

    async create(input) {
      const [row] = await db
        .insert(users)
        .values({
          email: input.email,
          phone: input.phone,
          canManageUsers: input.canManageUsers,
          canManageCampaigns: input.canManageCampaigns,
          canReceiveFunds: input.canReceiveFunds,
          passwordHash: input.passwordHash,
        })
        .returning({ id: users.id });

      if (!row) {
        throw new Error("Falha ao criar usuário");
      }
      return row;
    },

    async findAll() {
      return db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          canManageUsers: users.canManageUsers,
          canManageCampaigns: users.canManageCampaigns,
          canReceiveFunds: users.canReceiveFunds,
          mustChangePassword: users.mustChangePassword,
          active: users.active,
        })
        .from(users);
    },

    async findById(userId) {
      const [row] = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          mustChangePassword: users.mustChangePassword,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return row ?? null;
    },

    async updatePasswordHash(userId, passwordHash) {
      await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    },

    async setActive(userId, active) {
      await db.update(users).set({ active }).where(eq(users.id, userId));
    },

    async findUserForEdit(userId) {
      const [row] = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          canManageUsers: users.canManageUsers,
          canManageCampaigns: users.canManageCampaigns,
          canReceiveFunds: users.canReceiveFunds,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return row ?? null;
    },

    async emailInUseByAnotherUser(email, userId) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, userId)))
        .limit(1);
      return rows.length > 0;
    },

    async update(userId, input) {
      await db
        .update(users)
        .set({
          email: input.email,
          phone: input.phone ?? null,
          canManageUsers: input.canManageUsers,
          canManageCampaigns: input.canManageCampaigns,
          canReceiveFunds: input.canReceiveFunds,
        })
        .where(eq(users.id, userId));
    },
  };
}
