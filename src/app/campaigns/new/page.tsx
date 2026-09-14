import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createCampaign } from "@/server/application/create-campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { CampaignForm, type CreateCampaignState } from "../_components/campaign-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user.canManageCampaigns) {
    redirect("/");
  }

  async function create(
    _prevState: CreateCampaignState,
    formData: FormData,
  ): Promise<CreateCampaignState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const input = {
      name: formData.get("name"),
      goal: formData.get("goal"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    };

    try {
      const db = createDbClient();
      const repository = createCampaignRepository(db);
      await createCampaign(repository, input);
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível criar a campanha. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          goal: toStringValue(input.goal),
          startDate: toStringValue(input.startDate),
          endDate: toStringValue(input.endDate),
        },
      };
    }

    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CampaignForm action={create} />
    </div>
  );
}
