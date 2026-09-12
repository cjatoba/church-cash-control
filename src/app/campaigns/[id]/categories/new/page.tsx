import { createTransactionCategory } from "@/server/application/create-transaction-category";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CategoryForm, type CreateCategoryState } from "../_components/category-form";

export default async function NewTransactionCategoryPage({
  params,
}: PageProps<"/campaigns/[id]/categories/new">) {
  const { id: campaignId } = await params;

  async function create(
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
      await createTransactionCategory(repository, input);
    } catch {
      return { error: "Não foi possível criar a categoria. Confira os dados informados." };
    }

    return { success: Date.now() };
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CategoryForm
        action={create}
        backHref={`/campaigns/${campaignId}/categories`}
        backLabel="← Voltar para categorias"
      />
    </div>
  );
}
