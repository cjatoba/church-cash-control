import { loadEnvConfig } from "@next/env";
import { parseCredentials } from "../src/server/domain/credentials";
import { hashPassword } from "../src/server/infrastructure/auth/password";
import { createDbClient } from "../src/server/infrastructure/db/client";
import { users } from "../src/server/infrastructure/db/schema";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error("Uso: pnpm user:create <email> <senha>");
    process.exitCode = 1;
    return;
  }

  const { email, password } = parseCredentials({ email: emailArg, password: passwordArg });
  const passwordHash = await hashPassword(password);

  const db = createDbClient();
  await db.insert(users).values({ email, passwordHash });

  console.log(`Usuário ${email} criado.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
