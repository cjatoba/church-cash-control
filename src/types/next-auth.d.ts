import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}
