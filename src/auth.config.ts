import type { NextAuthConfig, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";

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

      if (pathname.startsWith("/users") && !auth.user.canManageUsers) {
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
      if (typeof user?.name === "string") {
        token.name = user.name;
      }
      if (typeof user?.phone === "string") {
        token.phone = user.phone;
      }
      if (typeof user?.mustChangePassword === "boolean") {
        token.mustChangePassword = user.mustChangePassword;
      }
      if (typeof user?.canManageUsers === "boolean") {
        token.canManageUsers = user.canManageUsers;
      }
      if (typeof user?.canManageCampaigns === "boolean") {
        token.canManageCampaigns = user.canManageCampaigns;
      }
      if (typeof user?.canReceiveFunds === "boolean") {
        token.canReceiveFunds = user.canReceiveFunds;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      if (typeof token.name === "string") {
        session.user.name = token.name;
      }
      if (typeof token.phone === "string") {
        session.user.phone = token.phone;
      }
      if (typeof token.mustChangePassword === "boolean") {
        session.user.mustChangePassword = token.mustChangePassword;
      }
      if (typeof token.canManageUsers === "boolean") {
        session.user.canManageUsers = token.canManageUsers;
      }
      if (typeof token.canManageCampaigns === "boolean") {
        session.user.canManageCampaigns = token.canManageCampaigns;
      }
      if (typeof token.canReceiveFunds === "boolean") {
        session.user.canReceiveFunds = token.canReceiveFunds;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
