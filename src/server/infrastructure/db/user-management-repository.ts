import { and, eq, ne } from "drizzle-orm";
import type { UserActiveRepository } from "@/server/application/deactivate-user";
import type { InviteUserRepository } from "@/server/application/invite-user";
import type { ManagedUserListRepository } from "@/server/application/list-managed-users";
import type { RegenerateTemporaryPasswordRepository } from "@/server/application/regenerate-temporary-password";
import type { UpdateUserRepository } from "@/server/application/update-user";
import { formatPhoneLabel } from "@/server/domain/phone";
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
    async phoneInUse(phone) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);
      return rows.length > 0;
    },

    async create(input) {
      const [row] = await db
        .insert(users)
        .values({
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
      const rows = await db
        .select({
          id: users.id,
          phone: users.phone,
          canManageUsers: users.canManageUsers,
          canManageCampaigns: users.canManageCampaigns,
          canReceiveFunds: users.canReceiveFunds,
          mustChangePassword: users.mustChangePassword,
          active: users.active,
        })
        .from(users);

      return rows.map((row) => ({ ...row, phone: formatPhoneLabel(row.phone) }));
    },

    async findById(userId) {
      const [row] = await db
        .select({
          id: users.id,
          phone: users.phone,
          active: users.active,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return row ? { ...row, phone: formatPhoneLabel(row.phone) } : null;
    },

    async updatePasswordHash(userId, passwordHash) {
      // Regenerar a senha temporária de alguém que já trocou a senha exige
      // forçar a troca de novo no próximo login — senão a pessoa fica com uma
      // senha temporária mas sem o fluxo de /change-password para defini-la.
      await db
        .update(users)
        .set({ passwordHash, mustChangePassword: true })
        .where(eq(users.id, userId));
    },

    async setActive(userId, active) {
      await db.update(users).set({ active }).where(eq(users.id, userId));
    },

    async findUserForEdit(userId) {
      const [row] = await db
        .select({
          id: users.id,
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

    async phoneInUseByAnotherUser(phone, userId) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.phone, phone), ne(users.id, userId)))
        .limit(1);
      return rows.length > 0;
    },

    async update(userId, input) {
      await db
        .update(users)
        .set({
          phone: input.phone,
          canManageUsers: input.canManageUsers,
          canManageCampaigns: input.canManageCampaigns,
          canReceiveFunds: input.canReceiveFunds,
        })
        .where(eq(users.id, userId));
    },
  };
}
