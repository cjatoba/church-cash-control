import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { parseCredentials } from "./server/domain/credentials";
import { verifyPassword } from "./server/infrastructure/auth/password";
import { createDbClient } from "./server/infrastructure/db/client";
import { findUserByEmail } from "./server/infrastructure/db/user-repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(rawCredentials) {
        let credentials;
        try {
          credentials = parseCredentials(rawCredentials);
        } catch {
          return null;
        }

        const db = createDbClient();
        const user = await findUserByEmail(db, credentials.email);
        if (!user) {
          return null;
        }

        const passwordMatches = await verifyPassword(credentials.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return { id: user.id, email: user.email, mustChangePassword: user.mustChangePassword };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
});
