import Link from "next/link";
import { redirect } from "next/navigation";
import { listTransactionCategories } from "@/server/application/list-transaction-categories";
import {
  archiveTransactionCategory,
  restoreTransactionCategory,
} from "@/server/application/archive-transaction-category";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { SubmitButton } from "@/app/_components/submit-button";

const typeLabels = { income: "Entrada", expense: "Saída" } as const;

export default async function TransactionCategoriesPage({
  params,
}: PageProps<"/campaigns/[id]/categories">) {
  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createTransactionCategoryRepository(db);
  const categories = await listTransactionCategories(repository, campaignId);
  const activeCategories = categories.filter((category) => category.active);
  const archivedCategories = categories.filter((category) => !category.active);

  async function archive(formData: FormData): Promise<void> {
    "use server";

    const categoryId = formData.get("categoryId");
    if (typeof categoryId !== "string") {
      throw new Error("Categoria inválida");
    }

    const db = createDbClient();
    const repository = createTransactionCategoryRepository(db);
    await archiveTransactionCategory(repository, categoryId);

    redirect(`/campaigns/${campaignId}/categories`);
  }

  async function restore(formData: FormData): Promise<void> {
    "use server";

    const categoryId = formData.get("categoryId");
    if (typeof categoryId !== "string") {
      throw new Error("Categoria inválida");
    }

    const db = createDbClient();
    const repository = createTransactionCategoryRepository(db);
    await restoreTransactionCategory(repository, categoryId);

    redirect(`/campaigns/${campaignId}/categories`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Categorias</h1>
          <Link
            href={`/campaigns/${campaignId}/categories/new`}
            className="text-sm text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            + Nova categoria
          </Link>
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
                className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
              >
                <span>
                  {category.name}{" "}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    · {typeLabels[category.type]}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/campaigns/${campaignId}/categories/${category.id}/edit`}
                    className="text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Editar
                  </Link>
                  <form action={archive}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <SubmitButton pendingLabel="Arquivando…">Arquivar</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {archivedCategories.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Categorias arquivadas
            </h2>
            <ul className="flex flex-col gap-2">
              {archivedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400"
                >
                  <span>
                    {category.name} <span className="text-xs">· {typeLabels[category.type]}</span>
                  </span>
                  <form action={restore}>
                    <input type="hidden" name="categoryId" value={category.id} />
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
