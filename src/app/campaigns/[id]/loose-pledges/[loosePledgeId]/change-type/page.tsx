import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLoosePledgeDetail } from "@/server/application/get-loose-pledge-detail";
import { getPledgeTypeChangeSource } from "@/server/application/change-pledge-type";
import { getCampaign } from "@/server/application/get-campaign";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createPledgeTypeChangeRepository } from "@/server/infrastructure/db/pledge-type-change-repository";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { formatCurrency } from "@/app/_lib/format";
import {
  ChangePledgeTypeForm,
  type ChangePledgeTypeState,
} from "../../../_components/change-pledge-type-form";
import { CurrentPledgeType } from "../../../_components/current-pledge-type";
import { submitPledgeTypeChange } from "../../../_lib/change-pledge-type-action";
import { buildFirstMonthOptions } from "../../../_lib/first-month-options";

export default async function ChangeLoosePledgeTypePage({
  params,
}: PageProps<"/campaigns/[id]/loose-pledges/[loosePledgeId]/change-type">) {
  const { id: campaignId, loosePledgeId } = await params;
  const session = await auth();
  if (!session?.user.canReceiveFunds) {
    redirect(`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`);
  }

  const db = createDbClient();
  const [loosePledge, source, pledgeTypes, campaign] = await Promise.all([
    getLoosePledgeDetail(createLoosePledgeRepository(db), loosePledgeId),
    getPledgeTypeChangeSource(createPledgeTypeChangeRepository(db), "loose", loosePledgeId),
    listPledgeTypes(createPledgeTypeRepository(db), campaignId),
    getCampaign(createCampaignRepository(db), campaignId),
  ]);
  if (!loosePledge || !campaign || source?.campaignId !== campaignId) {
    notFound();
  }

  const logContext = {
    donorName: loosePledge.donorName,
    currentTypeName: loosePledge.pledgeTypeName,
    typeNames: Object.fromEntries(pledgeTypes.map((type) => [type.id, type.name])),
  };

  async function change(
    _prevState: ChangePledgeTypeState,
    formData: FormData,
  ): Promise<ChangePledgeTypeState> {
    "use server";
    return submitPledgeTypeChange(campaignId, "loose", loosePledgeId, formData, logContext);
  }

  const contributionCount = loosePledge.contributions.length;

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`}
        backLabel="Voltar para o carnê"
        title="Corrigir tipo de carnê"
        subtitle={loosePledge.donorName}
      />
      <CurrentPledgeType
        label={`${loosePledge.pledgeTypeName} · avulso`}
        summary={
          contributionCount === 0
            ? "Nenhuma entrega registrada ainda"
            : `${String(contributionCount)} ${contributionCount === 1 ? "entrega registrada" : "entregas registradas"}`
        }
      />
      <ChangePledgeTypeForm
        source={{ kind: "loose", contributionCount }}
        hasPayments={source.hasPayments}
        options={pledgeTypes
          .filter((pledgeType) => pledgeType.id !== source.pledgeTypeId)
          .map((pledgeType) => ({
            id: pledgeType.id,
            name: pledgeType.name,
            installmentValueLabel: pledgeType.installmentValue
              ? formatCurrency(pledgeType.installmentValue)
              : null,
            installmentValueCents: pledgeType.installmentValue?.toCents() ?? null,
          }))}
        firstMonthOptions={buildFirstMonthOptions(campaign, new Date())}
        action={change}
      />
    </PageShell>
  );
}
