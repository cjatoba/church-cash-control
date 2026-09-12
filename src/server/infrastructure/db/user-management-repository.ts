import { eq } from "drizzle-orm";
import type { InviteUserRepository } from "@/server/application/invite-user";
import type { ManagedUserListRepository } from "@/server/application/list-managed-users";
import type { RegenerateTemporaryPasswordRepository } from "@/server/application/regenerate-temporary-password";
import type { DbClient } from "./client";
import { users } from "./schema";

export function createUserManagementRepository(
  db: DbClient,
): InviteUserRepository & ManagedUserListRepository & RegenerateTemporaryPasswordRepository {
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
          role: input.role,
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
          role: users.role,
          mustChangePassword: users.mustChangePassword,
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
  };
}
