import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { inviteUser } from "@/server/application/invite-user";
import { canManageUsers } from "@/server/domain/user-role";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { generateTemporaryPassword } from "@/server/infrastructure/auth/temporary-password";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { getLoginUrl } from "@/server/infrastructure/http/login-url";
import { InviteUserForm, type InviteUserState } from "./invite-user-form";

export default async function NewUserPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) {
    redirect("/");
  }

  async function invite(_prevState: InviteUserState, formData: FormData): Promise<InviteUserState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession || !canManageUsers(actionSession.user.role)) {
      redirect("/");
    }

    const input = {
      email: formData.get("email"),
      phone: formData.get("phone"),
      role: formData.get("role"),
    };

    try {
      const db = createDbClient();
      const repository = createUserManagementRepository(db);
      const loginUrl = await getLoginUrl();
      const result = await inviteUser(
        repository,
        { generateTemporaryPassword, hashPassword, loginUrl },
        input,
      );

      return {
        result: {
          email: result.email,
          role: result.role,
          temporaryPassword: result.temporaryPassword,
          whatsappLink: result.whatsappLink,
        },
      };
    } catch {
      return { error: "Não foi possível convidar o usuário. Confira os dados informados." };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <InviteUserForm action={invite} />
    </div>
  );
}
