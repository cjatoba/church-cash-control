import { headers } from "next/headers";

// Deriva a URL de login do host da própria requisição (em vez de uma env var
// fixa) para que o link funcione tanto em produção quanto em cada deploy de
// preview da Vercel, sem precisar configurar nada por ambiente.
export async function getLoginUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}/login`;
}
