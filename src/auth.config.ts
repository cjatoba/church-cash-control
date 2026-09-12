import type { NextAuthConfig, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { canManageUsers } from "./server/domain/user-role";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isOnLogin = pathname.startsWith("/login");
      const isOnChangePassword = pathname.startsWith("/change-password");

      if (!auth?.user) {
        return isOnLogin;
      }

      if (auth.user.mustChangePassword) {
        if (isOnChangePassword) {
          return true;
        }
        return NextResponse.redirect(new URL("/change-password", request.nextUrl));
      }

      if (isOnLogin || isOnChangePassword) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      if (pathname.startsWith("/users") && !canManageUsers(auth.user.role)) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
    // Precisa viver aqui (não só em auth.ts): o proxy roda uma instância
    // NextAuth só com authConfig, então se jwt/session ficassem apenas na
    // config completa, mustChangePassword nunca chegaria em auth.user
    // dentro do authorized acima, mesmo com o token já carregando o campo.
    jwt({ token, user }: { token: JWT; user?: User }) {
      // `user` só vem preenchido no login (trigger "signIn"/"signUp"); em
      // toda outra checagem de sessão (ex.: a cada request pelo proxy) ele
      // vem undefined, mesmo o tipo do Auth.js não marcando isso.
      if (user?.id) {
        token.id = user.id;
      }
      if (typeof user?.mustChangePassword === "boolean") {
        token.mustChangePassword = user.mustChangePassword;
      }
      if (typeof user?.role === "string") {
        token.role = user.role;
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
      if (token.role === "admin" || token.role === "treasurer") {
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
