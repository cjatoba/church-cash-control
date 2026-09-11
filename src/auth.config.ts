import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isOnLogin = pathname.startsWith("/login");

      if (isOnLogin) {
        return true;
      }

      if (!auth?.user) {
        return false;
      }

      const isOnChangePassword = pathname.startsWith("/change-password");
      if (auth.user.mustChangePassword && !isOnChangePassword) {
        return NextResponse.redirect(new URL("/change-password", request.nextUrl));
      }
      if (!auth.user.mustChangePassword && isOnChangePassword) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
    // Precisa viver aqui (não só em auth.ts): o proxy roda uma instância
    // NextAuth só com authConfig, então se jwt/session ficassem apenas na
    // config completa, mustChangePassword nunca chegaria em auth.user
    // dentro do authorized acima, mesmo com o token já carregando o campo.
    jwt({ token, user }) {
      if (user.id) {
        token.id = user.id;
      }
      if (typeof user.mustChangePassword === "boolean") {
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      if (typeof token.mustChangePassword === "boolean") {
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
