import { redirect } from "next/navigation";
import { createTransactionCategory } from "@/server/application/create-transaction-category";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

export default async function NewTransactionCategoryPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/categories/new">) {
  const { id: campaignId } = await params;
  const { error, created } = await searchParams;

  async function create(formData: FormData): Promise<void> {
    "use server";

    const input = {
      campaignId,
      name: formData.get("name"),
      type: formData.get("type"),
    };

    try {
      const db = createDbClient();
      const repository = createTransactionCategoryRepository(db);
      await createTransactionCategory(repository, input);
    } catch {
      redirect(`/campaigns/${campaignId}/categories/new?error=1`);
    }

    redirect(`/campaigns/${campaignId}/categories/new?created=1`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={create}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nova categoria</h1>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível criar a categoria. Confira os dados informados.
          </p>
        ) : null}
        {created ? (
          <p className="text-sm text-green-600 dark:text-green-400">
            Categoria criada com sucesso.
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Nome
          <input
            name="name"
            type="text"
            required
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Tipo
          <select
            name="type"
            required
            defaultValue=""
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          >
            <option value="" disabled>
              Selecione
            </option>
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Criar categoria
        </button>
      </form>
    </div>
  );
}
