import { notFound, redirect } from "next/navigation";
import { describeChanges } from "@/server/domain/activity-log";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { auth } from "@/auth";
import { updateUser } from "@/server/application/update-user";
import { activateUserAccess } from "@/server/application/activate-user-access";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { generateTemporaryPassword } from "@/server/infrastructure/auth/temporary-password";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { getLoginUrl } from "@/server/infrastructure/http/login-url";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { UserEditForm, type UserEditState } from "./user-edit-form";
import { ActivateAccessForm, type ActivateAccessState } from "./activate-access-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function EditUserPage({ params }: PageProps<"/users/[id]/edit">) {
  const session = await auth();
  if (!session?.user.canManageUsers) {
    redirect("/");
  }

  const { id: userId } = await params;
  const db = createDbClient();
  const repository = createUserManagementRepository(db);
  const user = await repository.findUserForEdit(userId);

  if (!user) {
    notFound();
  }

  const currentName = user.name;

  async function update(_prevState: UserEditState, formData: FormData): Promise<UserEditState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageUsers) {
      redirect("/");
    }

    const phoneValue = formData.get("phone");
    const input = {
      name: formData.get("name"),
      phone: typeof phoneValue === "string" ? phoneValue : undefined,
      canManageUsers: formData.get("canManageUsers"),
      canManageCampaigns: formData.get("canManageCampaigns"),
      canReceiveFunds: formData.get("canReceiveFunds"),
    };

    try {
      const db = createDbClient();
      const repository = createUserManagementRepository(db);
      await updateUser(repository, actionSession.user.id, userId, input);
      const newName = toStringValue(input.name).trim();
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "user_updated",
        subjectName: newName,
        details: describeChanges([{ label: "Nome", before: currentName, after: newName }]),
      });
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível salvar o usuário. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          phone: toStringValue(phoneValue),
          canManageUsers: Boolean(input.canManageUsers),
          canManageCampaigns: Boolean(input.canManageCampaigns),
          canReceiveFunds: Boolean(input.canReceiveFunds),
        },
      };
    }

    redirect("/users");
  }

  async function activate(
    _prevState: ActivateAccessState,
    formData: FormData,
  ): Promise<ActivateAccessState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageUsers) {
      redirect("/");
    }

    const input = {
      phone: formData.get("phone"),
      canManageUsers: formData.get("canManageUsers"),
      canManageCampaigns: formData.get("canManageCampaigns"),
      canReceiveFunds: formData.get("canReceiveFunds"),
    };

    try {
      const db = createDbClient();
      const repository = createUserManagementRepository(db);
      const loginUrl = await getLoginUrl();
      const { name: appName } = await getCachedAppBranding();
      const result = await activateUserAccess(
        repository,
        { generateTemporaryPassword, hashPassword, loginUrl, appName },
        userId,
        input,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "user_access_activated",
        subjectName: currentName,
      });

      return {
        values: {
          phone: result.phone,
          canManageUsers: Boolean(input.canManageUsers),
          canManageCampaigns: Boolean(input.canManageCampaigns),
          canReceiveFunds: Boolean(input.canReceiveFunds),
        },
        result: {
          phone: result.phone,
          temporaryPassword: result.temporaryPassword,
          whatsappLink: result.whatsappLink,
        },
      };
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível ativar o acesso. Confira os dados informados.",
        ),
        values: {
          phone: toStringValue(input.phone),
          canManageUsers: Boolean(input.canManageUsers),
          canManageCampaigns: Boolean(input.canManageCampaigns),
          canReceiveFunds: Boolean(input.canReceiveFunds),
        },
      };
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 py-10 dark:bg-black">
      <UserEditForm
        action={update}
        defaultValues={{
          name: user.name,
          phone: user.phone,
          canManageUsers: user.canManageUsers,
          canManageCampaigns: user.canManageCampaigns,
          canReceiveFunds: user.canReceiveFunds,
        }}
        isSelf={userId === session.user.id}
        backHref="/users"
      />
      {user.phone === null ? <ActivateAccessForm action={activate} userName={user.name} /> : null}
    </div>
  );
}
