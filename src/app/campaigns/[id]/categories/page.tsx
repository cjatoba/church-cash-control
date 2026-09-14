import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listTransactionCategories } from "@/server/application/list-transaction-categories";
import {
  archiveTransactionCategory,
  restoreTransactionCategory,
} from "@/server/application/archive-transaction-category";
import { recordActivity } from "@/server/application/record-activity";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";
import { ArchiveBoxIcon, ArrowPathIcon, PencilIcon } from "@/app/_components/icons";

const typeLabels = { income: "Entrada", expense: "Saída" } as const;

export default async function TransactionCategoriesPage({
  params,
}: PageProps<"/campaigns/[id]/categories">) {
  const session = await auth();
  const canManageCampaigns = Boolean(session?.user.canManageCampaigns);

  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createTransactionCategoryRepository(db);
  const categories = await listTransactionCategories(repository, campaignId);
  const activeCategories = categories.filter((category) => category.active);
  const archivedCategories = categories.filter((category) => !category.active);

  async function archive(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const categoryId = formData.get("categoryId");
    const categoryName = formData.get("categoryName");
    if (typeof categoryId !== "string" || typeof categoryName !== "string") {
      throw new Error("Categoria inválida");
    }

    const db = createDbClient();
    const repository = createTransactionCategoryRepository(db);
    await archiveTransactionCategory(repository, categoryId);

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: actionSession.user.id,
      action: "transaction_category_archived",
      subjectName: categoryName,
      amountCents: null,
    });

    redirect(`/campaigns/${campaignId}/categories`);
  }

  async function restore(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const categoryId = formData.get("categoryId");
    const categoryName = formData.get("categoryName");
    if (typeof categoryId !== "string" || typeof categoryName !== "string") {
      throw new Error("Categoria inválida");
    }

    const db = createDbClient();
    const repository = createTransactionCategoryRepository(db);
    await restoreTransactionCategory(repository, categoryId);

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: actionSession.user.id,
      action: "transaction_category_restored",
      subjectName: categoryName,
      amountCents: null,
    });

    redirect(`/campaigns/${campaignId}/categories`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <BackLink href="/" />
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Categorias</h1>
          {canManageCampaigns ? (
            <Link
              href={`/campaigns/${campaignId}/categories/new`}
              className="rounded px-2 py-1.5 text-sm font-medium text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              + Nova categoria
            </Link>
          ) : null}
        </div>

        {activeCategories.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhuma categoria cadastrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeCategories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-3 text-sm dark:border-white/[.16]"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {category.name}{" "}
                  <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    · {typeLabels[category.type]}
                  </span>
                </span>
                {canManageCampaigns ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/campaigns/${campaignId}/categories/${category.id}/edit`}
                      className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                    <form action={archive}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="categoryName" value={category.name} />
                      <SubmitButton pendingLabel="Arquivando…" variant="text">
                        <ArchiveBoxIcon className="h-3.5 w-3.5" />
                        Arquivar
                      </SubmitButton>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {archivedCategories.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Categorias arquivadas
            </h2>
            <ul className="flex flex-col gap-2">
              {archivedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-3 text-sm text-zinc-500 dark:border-white/[.16] dark:text-zinc-400"
                >
                  <span>
                    {category.name} <span className="text-xs">· {typeLabels[category.type]}</span>
                  </span>
                  {canManageCampaigns ? (
                    <form action={restore}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="categoryName" value={category.name} />
                      <SubmitButton pendingLabel="Reativando…" variant="text">
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        Reativar
                      </SubmitButton>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
