import { defineConfig } from "drizzle-kit";

// Conexão direta (não-pooled): a Neon recomenda não usar a connection string
// pooled para rodar migrations via drizzle-kit (ver ROADMAP.md, item sobre
// investigação do "drizzle-kit migrate finge sucesso"). DATABASE_URL_UNPOOLED
// é opcional — cai para DATABASE_URL (pooled) se não estiver configurada,
// para não quebrar ambientes que ainda não a definiram — mas defina-a em
// Production/Preview na Vercel (e em .env.local) assim que possível: copie a
// variante "Direct connection" do console da Neon.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED nem DATABASE_URL configuradas — copie .env.example para .env.local",
  );
}

export default defineConfig({
  schema: "./src/server/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
