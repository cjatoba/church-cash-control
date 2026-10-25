import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changePledgeType } from "@/server/application/change-pledge-type";
import type { PledgeKind } from "@/server/domain/pledge-type-change";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createPledgeTypeChangeRepository } from "@/server/infrastructure/db/pledge-type-change-repository";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import type { ChangePledgeTypeState } from "../_components/change-pledge-type-form";

function optionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export async function submitPledgeTypeChange(
  campaignId: string,
  sourceKind: PledgeKind,
  sourceId: string,
  formData: FormData,
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
