import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createTransactionCategory } from "@/server/application/create-transaction-category";
import { createTransactionCategoryRepository } from "@/server/infrastructure/db/transaction-category-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { CategoryForm, type CreateCategoryState } from "../_components/category-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function NewTransactionCategoryPage({
  params,
}: PageProps<"/campaigns/[id]/categories/new">) {
  const session = await auth();
  if (!session?.user.canManageCampaigns) {
    redirect("/");
  }

  const { id: campaignId } = await params;

  async function create(
    _prevState: CreateCategoryState,
    formData: FormData,
  ): Promise<CreateCategoryState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const input = {
      campaignId,
      name: formData.get("name"),
      type: formData.get("type"),
    };

    try {
      const db = createDbClient();
      const repository = createTransactionCategoryRepository(db);
      await createTransactionCategory(repository, input);
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível criar a categoria. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          type: toStringValue(input.type),
        },
      };
    }

    return { success: Date.now() };
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CategoryForm action={create} backHref={`/campaigns/${campaignId}/categories`} />
    </div>
  );
}
