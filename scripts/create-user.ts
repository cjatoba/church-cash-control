import { loadEnvConfig } from "@next/env";
import { parseCredentials } from "../src/server/domain/credentials";
import { hashPassword } from "../src/server/infrastructure/auth/password";
import { createDbClient } from "../src/server/infrastructure/db/client";
import { users } from "../src/server/infrastructure/db/schema";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const [, , phoneArg, passwordArg] = process.argv;
  if (!phoneArg || !passwordArg) {
    console.error("Uso: pnpm user:create <celular> <senha>");
    process.exitCode = 1;
    return;
  }

  const { phone, password } = parseCredentials({ phone: phoneArg, password: passwordArg });
  const passwordHash = await hashPassword(password);

  const db = createDbClient();
  await db.insert(users).values({
    phone,
    passwordHash,
    canManageUsers: true,
    canManageCampaigns: true,
    canReceiveFunds: true,
  });

  console.log(`Usuário ${phone} criado.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
