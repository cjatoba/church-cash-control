import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createDbClient } from "../src/server/infrastructure/db/client";

loadEnvConfig(process.cwd());

const migrationsFolder = path.join(process.cwd(), "drizzle");

const journalSchema = z.object({
  entries: z.array(z.object({ tag: z.string() })),
});

const migrationRowSchema = z.object({ hash: z.string() });

/**
 * O `drizzle-kit migrate` já reportou "sucesso" em produção sem aplicar
 * nada de verdade (ver ROADMAP.md) — este script confere, logo depois do
 * migrate, que toda migration commitada realmente virou uma linha em
 * `drizzle.__drizzle_migrations`, para o build falhar de forma visível em
 * vez de deployar com o schema desatualizado.
 */
async function main(): Promise<void> {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = journalSchema.parse(JSON.parse(readFileSync(journalPath, "utf8")));

  const expectedMigrations = journal.entries.map((entry) => {
    const sqlContent = readFileSync(path.join(migrationsFolder, `${entry.tag}.sql`), "utf8");
    return { tag: entry.tag, hash: createHash("sha256").update(sqlContent).digest("hex") };
  });

  const db = createDbClient();
  const result = await db.execute<z.infer<typeof migrationRowSchema>>(
    sql`select hash from drizzle.__drizzle_migrations`,
  );
  const appliedHashes = new Set(result.rows.map((row) => migrationRowSchema.parse(row).hash));

  const missing = expectedMigrations.filter((migration) => !appliedHashes.has(migration.hash));
  if (missing.length > 0) {
    console.error(
      `Migration(s) não aplicada(s) no banco, apesar do 'drizzle-kit migrate' ter reportado sucesso: ${missing
        .map((migration) => migration.tag)
        .join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`${String(expectedMigrations.length)} migration(s) verificada(s) — todas aplicadas.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
