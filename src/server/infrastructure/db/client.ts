import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "@/shared/env";
import * as schema from "./schema";

export function createDbClient() {
  const sql = neon(getEnv().DATABASE_URL);
  return drizzle({ client: sql, schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
