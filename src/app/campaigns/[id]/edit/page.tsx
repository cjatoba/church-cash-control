import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCampaign } from "@/server/application/get-campaign";
import { updateCampaign } from "@/server/application/update-campaign";
import { recordActivity } from "@/server/application/record-activity";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CampaignForm, type CreateCampaignState } from "../../_components/campaign-form";

export default async function EditCampaignPage({ params }: PageProps<"/campaigns/[id]/edit">) {
  const session = await auth();
  if (!session?.user.canManageCampaigns) {
    redirect("/");
  }

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

    if (typeof input.name === "string") {
      const db = createDbClient();
      const activityLogRepository = createActivityLogRepository(db);
      await recordActivity(activityLogRepository, {
        actorUserId: actionSession.user.id,
        action: "campaign_updated",
        subjectName: input.name,
        amountCents: null,
      });
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
