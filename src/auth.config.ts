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
  },
  providers: [],
} satisfies NextAuthConfig;
