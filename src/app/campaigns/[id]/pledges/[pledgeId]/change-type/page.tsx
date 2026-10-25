import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPledgeDetail } from "@/server/application/get-pledge-detail";
import { getPledgeTypeChangeSource } from "@/server/application/change-pledge-type";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
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

export default async function ChangeFixedPledgeTypePage({
  params,
}: PageProps<"/campaigns/[id]/pledges/[pledgeId]/change-type">) {
  const { id: campaignId, pledgeId } = await params;
  const session = await auth();
  if (!session?.user.canReceiveFunds) {
    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  const db = createDbClient();
  const [pledge, source, pledgeTypes] = await Promise.all([
    getPledgeDetail(createPledgeRepository(db), pledgeId),
    getPledgeTypeChangeSource(createPledgeTypeChangeRepository(db), "fixed", pledgeId),
    listPledgeTypes(createPledgeTypeRepository(db), campaignId),
  ]);
  if (!pledge || source?.campaignId !== campaignId) {
    notFound();
  }

  async function change(
    _prevState: ChangePledgeTypeState,
    formData: FormData,
  ): Promise<ChangePledgeTypeState> {
    "use server";
    return submitPledgeTypeChange(campaignId, "fixed", pledgeId, formData);
  }

  const paidCount = pledge.installments.filter((installment) => installment.paidAt).length;
  const pendingCount = pledge.installments.length - paidCount;

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}/pledges/${pledgeId}`}
        backLabel="Voltar para o carnê"
        title="Corrigir tipo de carnê"
        subtitle={pledge.donorName}
      />
      <CurrentPledgeType
        label={`${pledge.pledgeTypeName} · ${formatCurrency(pledge.installmentValue)}/mês`}
        summary={
          paidCount === 0
            ? "Nenhuma parcela paga ainda"
            : `${String(paidCount)} de ${String(pledge.installments.length)} parcelas pagas`
        }
      />
      <ChangePledgeTypeForm
        source={{
          kind: "fixed",
          installmentValueLabel: formatCurrency(pledge.installmentValue),
          pendingCount,
          paidCount,
        }}
        hasPayments={source.hasPayments}
        options={pledgeTypes
          .filter((pledgeType) => pledgeType.id !== source.pledgeTypeId)
          .map((pledgeType) => ({
            id: pledgeType.id,
            name: pledgeType.name,
            installmentValueLabel: pledgeType.installmentValue
              ? formatCurrency(pledgeType.installmentValue)
              : null,
          }))}
        firstMonthOptions={[]}
        action={change}
      />
    </PageShell>
  );
}
