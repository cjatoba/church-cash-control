import { BackLink } from "@/app/_components/back-link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { regenerateTemporaryPassword } from "@/server/application/regenerate-temporary-password";
import { canRegenerateTemporaryPassword } from "@/server/domain/temporary-password-reset";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { generateTemporaryPassword } from "@/server/infrastructure/auth/temporary-password";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { getLoginUrl } from "@/server/infrastructure/http/login-url";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { ResetPasswordForm, type ResetPasswordState } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: PageProps<"/users/[id]/reset-password">) {
  const session = await auth();
  if (!session?.user.canManageUsers) {
    redirect("/");
  }

  const { id: userId } = await params;
  const db = createDbClient();
  const repository = createUserManagementRepository(db);
  const user = await repository.findById(userId);

  if (!user) {
    notFound();
  }

  async function regenerate(): Promise<ResetPasswordState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageUsers) {
      redirect("/");
    }

    try {
      const db = createDbClient();
      const repository = createUserManagementRepository(db);
      const loginUrl = await getLoginUrl();
      const result = await regenerateTemporaryPassword(
        repository,
        { generateTemporaryPassword, hashPassword, loginUrl },
        userId,
      );

      return {
        result: {
          phone: result.phone,
          temporaryPassword: result.temporaryPassword,
          whatsappLink: result.whatsappLink,
        },
      };
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(error, "Não foi possível gerar uma nova senha temporária."),
      };
    }
  }

  if (!canRegenerateTemporaryPassword(user)) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
          <BackLink href="/users" />
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Usuário desativado</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.phone} está desativado — reative o usuário antes de gerar uma nova senha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <ResetPasswordForm action={regenerate} phone={user.phone} />
    </div>
  );
}
