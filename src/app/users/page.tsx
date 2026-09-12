import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deactivateUser, reactivateUser } from "@/server/application/deactivate-user";
import { listManagedUsers } from "@/server/application/list-managed-users";
import { canManageUsers } from "@/server/domain/user-role";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { SubmitButton } from "@/app/_components/submit-button";

const roleLabels = { admin: "Administrador", fundraiser: "Responsável pela arrecadação" } as const;

export default async function UsersPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) {
    redirect("/");
  }
  const currentUserId = session.user.id;

  const db = createDbClient();
  const repository = createUserManagementRepository(db);
  const managedUsers = await listManagedUsers(repository);
  const activeUsers = managedUsers.filter((user) => user.active);
  const inactiveUsers = managedUsers.filter((user) => !user.active);

  async function deactivate(formData: FormData): Promise<void> {
    "use server";

    const session = await auth();
    if (!session || !canManageUsers(session.user.role)) {
      redirect("/");
    }

    const userId = formData.get("userId");
    if (typeof userId !== "string") {
      throw new Error("Usuário inválido");
    }

    const db = createDbClient();
    const repository = createUserManagementRepository(db);
    await deactivateUser(repository, session.user.id, userId);

    redirect("/users");
  }

  async function reactivate(formData: FormData): Promise<void> {
    "use server";

    const session = await auth();
    if (!session || !canManageUsers(session.user.role)) {
      redirect("/");
    }

    const userId = formData.get("userId");
    if (typeof userId !== "string") {
      throw new Error("Usuário inválido");
    }

    const db = createDbClient();
    const repository = createUserManagementRepository(db);
    await reactivateUser(repository, userId);

    redirect("/users");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Usuários</h1>
          <Link
            href="/users/new"
            className="text-sm text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            + Convidar usuário
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {activeUsers.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
            >
              <div className="flex flex-col">
                <span className="text-black dark:text-zinc-50">{user.email}</span>
                {user.phone ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.phone}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {user.mustChangePassword ? (
                  <>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      Troca pendente
                    </span>
                    <Link
                      href={`/users/${user.id}/reset-password`}
                      className="text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      Gerar nova senha
                    </Link>
                  </>
                ) : null}
                <span className="rounded-full border border-black/[.14] px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/[.22] dark:text-zinc-300">
                  {roleLabels[user.role]}
                </span>
                {user.id !== currentUserId ? (
                  <form action={deactivate}>
                    <input type="hidden" name="userId" value={user.id} />
                    <SubmitButton pendingLabel="Desativando…">Desativar</SubmitButton>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {inactiveUsers.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Usuários desativados
            </h2>
            <ul className="flex flex-col gap-2">
              {inactiveUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400"
                >
                  <span>{user.email}</span>
                  <form action={reactivate}>
                    <input type="hidden" name="userId" value={user.id} />
                    <SubmitButton pendingLabel="Reativando…">Reativar</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
