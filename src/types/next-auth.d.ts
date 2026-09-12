import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/server/domain/user-role";

declare module "next-auth" {
  interface User {
    mustChangePassword?: boolean;
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      role: UserRole;
    } & DefaultSession["user"];
  }
}
