import { redirect } from "next/navigation";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { auth } from "@/auth";
import { inviteUser } from "@/server/application/invite-user";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { generateTemporaryPassword } from "@/server/infrastructure/auth/temporary-password";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { getLoginUrl } from "@/server/infrastructure/http/login-url";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { InviteUserForm, type InviteUserState } from "./invite-user-form";

function toStringValue(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user.canManageUsers) {
    redirect("/");
  }

  async function invite(_prevState: InviteUserState, formData: FormData): Promise<InviteUserState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageUsers) {
      redirect("/");
    }

    const hasAccess = formData.get("hasAccess") != null;
    const input = {
      name: formData.get("name"),
      phone: hasAccess ? formData.get("phone") : undefined,
      canManageUsers: formData.get("canManageUsers"),
      canManageCampaigns: formData.get("canManageCampaigns"),
      canReceiveFunds: formData.get("canReceiveFunds"),
    };

    try {
      const db = createDbClient();
      const repository = createUserManagementRepository(db);
      const loginUrl = await getLoginUrl();
      const { name: appName } = await getCachedAppBranding();
      const result = await inviteUser(
        repository,
        { generateTemporaryPassword, hashPassword, loginUrl, appName },
        input,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "user_invited",
        subjectName: result.name,
      });

      return {
        result: {
          name: result.name,
          phone: result.phone,
          canManageUsers: result.canManageUsers,
          canManageCampaigns: result.canManageCampaigns,
          canReceiveFunds: result.canReceiveFunds,
          temporaryPassword: result.temporaryPassword,
          whatsappLink: result.whatsappLink,
        },
      };
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível convidar o usuário. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          hasAccess,
          phone: toStringValue(input.phone),
          canManageUsers: Boolean(input.canManageUsers),
          canManageCampaigns: Boolean(input.canManageCampaigns),
          canReceiveFunds: Boolean(input.canReceiveFunds),
        },
      };
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
      <InviteUserForm action={invite} />
    </div>
  );
}
