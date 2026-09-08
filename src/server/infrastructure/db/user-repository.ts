import { eq } from "drizzle-orm";
import type { DbClient } from "./client";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export async function findUserByEmail(db: DbClient, email: string): Promise<UserRecord | null> {
  const rows = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows[0] ?? null;
}
