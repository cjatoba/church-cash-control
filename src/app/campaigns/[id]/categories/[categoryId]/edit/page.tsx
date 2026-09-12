import { notFound, redirect } from "next/navigation";
import { getTransactionCategory } from "@/server/application/get-transaction-category";
import { updateTransactionCategory } from "@/server/application/update-transaction-category";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CategoryForm, type CreateCategoryState } from "../../_components/category-form";

export default async function EditTransactionCategoryPage({
  params,
}: PageProps<"/campaigns/[id]/categories/[categoryId]/edit">) {
  const { id: campaignId, categoryId } = await params;
  const db = createDbClient();
  const repository = createTransactionCategoryRepository(db);
  const category = await getTransactionCategory(repository, categoryId);

  if (!category) {
    notFound();
  }

  async function update(
    _prevState: CreateCategoryState,
    formData: FormData,
  ): Promise<CreateCategoryState> {
    "use server";

    const input = {
      campaignId,
      name: formData.get("name"),
      type: formData.get("type"),
    };

    try {
      const db = createDbClient();
      const repository = createTransactionCategoryRepository(db);
      await updateTransactionCategory(repository, categoryId, input);
    } catch {
      return { error: "Não foi possível salvar a categoria. Confira os dados informados." };
    }

    redirect(`/campaigns/${campaignId}/categories`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CategoryForm
        action={update}
        backHref={`/campaigns/${campaignId}/categories`}
        backLabel="← Voltar para categorias"
        heading="Editar categoria"
        submitLabel="Salvar categoria"
        pendingLabel="Salvando…"
        defaultValues={{ name: category.name, type: category.type }}
      />
    </div>
  );
}
