import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { changeOwnPassword } from "@/server/application/change-own-password";
import { hashPassword, verifyPassword } from "@/server/infrastructure/auth/password";
import { createDbClient } from "@/server/infrastructure/db/client";
import { createUserPasswordRepository } from "@/server/infrastructure/db/user-password-repository";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { ChangeOwnPasswordForm, type ChangeOwnPasswordState } from "./change-own-password-form";

export default async function AccountPasswordPage() {
  const session = await auth();
  const userId = session?.user.id;

  async function submit(
    _prevState: ChangeOwnPasswordState,
    formData: FormData,
  ): Promise<ChangeOwnPasswordState> {
    "use server";

    if (!userId) {
      redirect("/login");
    }

    const input = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmNewPassword: formData.get("confirmNewPassword"),
    };

    try {
      const db = createDbClient();
      const repository = createUserPasswordRepository(db);
      await changeOwnPassword(
        { passwordReader: repository, repository, verifyPassword, hashPassword },
        userId,
        input,
      );
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível trocar a senha. Confira os dados informados.",
        ),
      };
    }

    await signOut({ redirectTo: "/login?passwordChanged=1" });
    return {};
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <ChangeOwnPasswordForm action={submit} />
    </div>
  );
}
