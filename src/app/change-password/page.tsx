import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { changePassword } from "@/server/application/change-password";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { createDbClient } from "@/server/infrastructure/db/client";
import { createUserPasswordRepository } from "@/server/infrastructure/db/user-password-repository";
import { ChangePasswordForm, type ChangePasswordState } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();
  const userId = session?.user.id;

  async function submit(
    _prevState: ChangePasswordState,
    formData: FormData,
  ): Promise<ChangePasswordState> {
    "use server";

    if (!userId) {
      redirect("/login");
    }

    const input = {
      newPassword: formData.get("newPassword"),
      confirmNewPassword: formData.get("confirmNewPassword"),
    };

    try {
      const db = createDbClient();
      const repository = createUserPasswordRepository(db);
      await changePassword(repository, hashPassword, userId, input);
    } catch {
      return {
        error:
          "Não foi possível alterar a senha. Confira se as senhas digitadas coincidem e têm pelo menos 8 caracteres.",
      };
    }

    await signOut({ redirectTo: "/login?passwordChanged=1" });
    return {};
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <ChangePasswordForm action={submit} />
    </div>
  );
}
