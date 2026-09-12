import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateUser } from "@/server/application/update-user";
import { canManageUsers } from "@/server/domain/user-role";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { UserEditForm, type UserEditState } from "./user-edit-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function EditUserPage({ params }: PageProps<"/users/[id]/edit">) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) {
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
      await updateUser(repository, actionSession.user.id, userId, input);
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível salvar o usuário. Confira os dados informados.",
        ),
        values: {
          email: toStringValue(input.email),
          phone: toStringValue(input.phone),
          role: toStringValue(input.role),
        },
      };
    }

    redirect("/users");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <UserEditForm
        action={update}
        defaultValues={{ email: user.email, phone: user.phone, role: user.role }}
        isSelf={userId === session.user.id}
      />
    </div>
  );
}
