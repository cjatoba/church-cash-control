import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateUser } from "@/server/application/update-user";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { UserEditForm, type UserEditState } from "./user-edit-form";

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

  async function update(_prevState: UserEditState, formData: FormData): Promise<UserEditState> {
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
      await updateUser(repository, actionSession.user.id, userId, input);
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível salvar o usuário. Confira os dados informados.",
        ),
        values: {
          phone: toStringValue(input.phone),
          canManageUsers: Boolean(input.canManageUsers),
          canManageCampaigns: Boolean(input.canManageCampaigns),
          canReceiveFunds: Boolean(input.canReceiveFunds),
        },
      };
    }

    redirect("/users");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <UserEditForm
        action={update}
        defaultValues={{
          phone: user.phone,
          canManageUsers: user.canManageUsers,
          canManageCampaigns: user.canManageCampaigns,
          canReceiveFunds: user.canReceiveFunds,
        }}
        isSelf={userId === session.user.id}
      />
    </div>
  );
}
