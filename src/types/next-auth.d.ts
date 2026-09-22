import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    phone?: string;
    mustChangePassword?: boolean;
    canManageUsers?: boolean;
    canManageCampaigns?: boolean;
    canReceiveFunds?: boolean;
  }

  interface Session {
    user: {
      id: string;
      phone: string;
      mustChangePassword: boolean;
      canManageUsers: boolean;
      canManageCampaigns: boolean;
      canReceiveFunds: boolean;
    } & DefaultSession["user"];
  }
}
