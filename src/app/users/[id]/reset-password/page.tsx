import { BackLink } from "@/app/_components/back-link";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
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
      const { name: appName } = await getCachedAppBranding();
      const result = await regenerateTemporaryPassword(
        repository,
        { generateTemporaryPassword, hashPassword, loginUrl, appName },
        userId,
      );

      return {
        result: {
          name: result.name,
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
    const reason = user.active
      ? `${user.name} não tem acesso ao sistema (sem celular cadastrado) — ative o acesso antes de gerar uma nova senha.`
      : `${user.name} está desativado — reative o usuário antes de gerar uma nova senha.`;
    return (
      <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
        <div className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          <BackLink href="/users" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Não é possível gerar senha
          </h1>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">{reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
      <ResetPasswordForm action={regenerate} name={user.name} />
    </div>
  );
}
