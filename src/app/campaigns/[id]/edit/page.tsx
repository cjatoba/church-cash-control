import { notFound, redirect } from "next/navigation";
import { getCampaign } from "@/server/application/get-campaign";
import { updateCampaign } from "@/server/application/update-campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CampaignForm, type CreateCampaignState } from "../../_components/campaign-form";

export default async function EditCampaignPage({ params }: PageProps<"/campaigns/[id]/edit">) {
  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createCampaignRepository(db);
  const campaign = await getCampaign(repository, campaignId);

  if (!campaign) {
    notFound();
  }

  const installmentRepository = createInstallmentRepository(db);
  const pendingInstallments = await installmentRepository.findInstallmentsByCampaign(campaignId);
  const previousEndDate = campaign.endDate;

  async function update(
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

    let outcome;
    try {
      const db = createDbClient();
      const campaignRepository = createCampaignRepository(db);
      const installmentRepository = createInstallmentRepository(db);
      outcome = await updateCampaign(
        {
          campaignRepository,
          installmentsReader: installmentRepository,
          installmentsRemover: installmentRepository,
        },
        campaignId,
        input,
        previousEndDate,
      );
    } catch {
      return { error: "Não foi possível salvar a campanha. Confira os dados informados." };
    }

    redirect(outcome.periodExtended ? "/?campaignExtended=1" : "/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <CampaignForm
        action={update}
        heading="Editar campanha"
        submitLabel="Salvar campanha"
        pendingLabel="Salvando…"
        defaultValues={{
          name: campaign.name,
          goal: campaign.goal.toCents() / 100,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        }}
        pendingInstallments={pendingInstallments}
      />
    </div>
  );
}
