import { defineConfig } from "drizzle-kit";

// Conexão direta (não-pooled): a Neon recomenda não usar a connection string
// pooled para rodar migrations via drizzle-kit (ver ROADMAP.md, item sobre
// investigação do "drizzle-kit migrate finge sucesso"). A integração
// Neon-Vercel já provisiona DATABASE_URL_UNPOOLED automaticamente em
// Production/Preview; em desenvolvimento local, copie a variante "direct
// connection" do console da Neon.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED não configurada — copie .env.example para .env.local");
}

export default defineConfig({
  schema: "./src/server/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
