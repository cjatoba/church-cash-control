import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // O manifesto e os ícones do app precisam ficar públicos: o navegador os
  // busca sem a sessão de login para permitir instalar o app no celular.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|apple-icon.png|icons/).*)",
  ],
};
