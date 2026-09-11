import { redirect } from "next/navigation";
import { createCampaign } from "@/server/application/create-campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CampaignForm, type CreateCampaignState } from "./campaign-form";

export default function NewCampaignPage() {
  async function create(
    _prevState: CreateCampaignState,
    formData: FormData,
  ): Promise<CreateCampaignState> {
    "use server";

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
    } catch {
      return { error: "Não foi possível criar a campanha. Confira os dados informados." };
    }

    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CampaignForm action={create} />
    </div>
  );
}
