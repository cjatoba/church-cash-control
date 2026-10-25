import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changePledgeType } from "@/server/application/change-pledge-type";
import type { PledgeKind } from "@/server/domain/pledge-type-change";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createPledgeTypeChangeRepository } from "@/server/infrastructure/db/pledge-type-change-repository";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { describeChanges } from "@/server/domain/activity-log";
import type { ChangePledgeTypeState } from "../_components/change-pledge-type-form";

function optionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export interface PledgeTypeChangeLogContext {
  donorId: string;
  donorName: string;
  currentTypeName: string;
  typeNames: Record<string, string>;
}

export async function submitPledgeTypeChange(
  campaignId: string,
  sourceKind: PledgeKind,
  sourceId: string,
  formData: FormData,
  logContext: PledgeTypeChangeLogContext,
): Promise<ChangePledgeTypeState> {
  const session = await auth();
  if (!session?.user.canReceiveFunds) {
    redirect("/");
  }

  let result: { kind: PledgeKind; id: string };
  try {
    const db = createDbClient();
    result = await changePledgeType(
      {
        repository: createPledgeTypeChangeRepository(db),
        pledgeTypeReader: createPledgeTypeRepository(db),
        campaignReader: createCampaignRepository(db),
      },
      {
        sourceKind,
        sourceId,
        pledgeTypeId: formData.get("pledgeTypeId"),
        firstInstallmentMonth: optionalString(formData.get("firstInstallmentMonth")),
        installmentCount: optionalString(formData.get("installmentCount")),
      },
    );
    const newTypeId = formData.get("pledgeTypeId");
    await logActivity(db, {
      actorUserId: session.user.id,
      action: "pledge_type_changed",
      subjectName: logContext.donorName,
      donorId: logContext.donorId,
      details: describeChanges([
        {
          label: "Tipo",
          before: logContext.currentTypeName,
          after:
            (typeof newTypeId === "string" ? logContext.typeNames[newTypeId] : undefined) ?? "—",
        },
      ]),
    });
  } catch (error) {
    return {
      error: toFriendlyErrorMessage(error, "Não foi possível corrigir o tipo do carnê."),
    };
  }

  redirect(
    result.kind === "fixed"
      ? `/campaigns/${campaignId}/pledges/${result.id}`
      : `/campaigns/${campaignId}/loose-pledges/${result.id}`,
  );
}
