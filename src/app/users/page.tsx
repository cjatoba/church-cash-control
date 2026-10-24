import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deactivateUser, reactivateUser } from "@/server/application/deactivate-user";
import { listManagedUsers, type ManagedUser } from "@/server/application/list-managed-users";
import { createUserManagementRepository } from "@/server/infrastructure/db/user-management-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { formatPhoneLabel } from "@/server/domain/phone";
import { SubmitButton } from "@/app/_components/submit-button";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Tabs } from "@/app/_components/tabs";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { ArrowPathIcon, LockIcon, PencilIcon, PlusIcon, TrashIcon } from "@/app/_components/icons";

function capabilityLabels(user: ManagedUser): string[] {
  const labels: string[] = [];
  if (user.canManageUsers) labels.push("Gerencia usuários");
  if (user.canManageCampaigns) labels.push("Gerencia campanhas");
  if (user.canReceiveFunds) labels.push("Recebe arrecadação");
  return labels.length > 0 ? labels : ["Só visualização"];
}

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user.canManageUsers) {
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
    if (!session?.user.canManageUsers) {
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
    if (!session?.user.canManageUsers) {
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

  const activeList = (
    <ul className="flex flex-col gap-3">
      {activeUsers.map((user) => (
        <li
          key={user.id}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[17px] font-semibold">
              {user.id === currentUserId ? `${user.name} (você)` : user.name}
            </span>
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
              {user.phone ? formatPhoneLabel(user.phone) : "Sem acesso ao sistema"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.mustChangePassword ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Ainda não trocou a senha
              </span>
            ) : null}
            {user.phone !== null
              ? capabilityLabels(user).map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {label}
                  </span>
                ))
              : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <Link
              href={`/users/${user.id}/edit`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </Link>
            {user.phone !== null ? (
              <Link
                href={`/users/${user.id}/reset-password`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <LockIcon className="h-4 w-4" />
                Gerar nova senha
              </Link>
            ) : null}
            {user.id !== currentUserId ? (
              <form action={deactivate}>
                <input type="hidden" name="userId" value={user.id} />
                <SubmitButton pendingLabel="Desativando…" variant="text">
                  <TrashIcon className="h-4 w-4" />
                  Desativar
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );

  const inactiveList =
    inactiveUsers.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhum voluntário desativado.
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {inactiveUsers.map((user) => (
          <li
            key={user.id}
            className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <span className="text-[17px] text-zinc-600 dark:text-zinc-400">{user.name}</span>
            <form action={reactivate}>
              <input type="hidden" name="userId" value={user.id} />
              <SubmitButton pendingLabel="Reativando…" variant="outline">
                <ArrowPathIcon className="h-5 w-5" />
                Reativar
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    );

  return (
    <PageShell>
      <PageHeader backHref="/menu" title="Voluntários e acessos" />

      <Link
        href="/users/new"
        className={`${buttonBaseClassName} ${buttonClassNames.primary} w-full`}
      >
        <PlusIcon />
        Cadastrar voluntário
      </Link>

      <Tabs
        label="Voluntários"
        initialTabId="active"
        tabs={[
          { id: "active", label: `Ativos (${String(activeUsers.length)})`, content: activeList },
          {
            id: "inactive",
            label: `Desativados (${String(inactiveUsers.length)})`,
            content: inactiveList,
          },
        ]}
      />
    </PageShell>
  );
}
