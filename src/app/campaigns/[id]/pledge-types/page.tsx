import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { formatCurrency } from "@/app/_lib/format";
import { auth } from "@/auth";
import { createPledgeType } from "@/server/application/create-pledge-type";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { PledgeTypeForm, type CreatePledgeTypeState } from "./pledge-type-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function PledgeTypesPage({
  params,
}: PageProps<"/campaigns/[id]/pledge-types">) {
  const session = await auth();
  const canManageCampaigns = Boolean(session?.user.canManageCampaigns);

  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createPledgeTypeRepository(db);
  const pledgeTypes = await listPledgeTypes(repository, campaignId);

  async function create(
    _prevState: CreatePledgeTypeState,
    formData: FormData,
  ): Promise<CreatePledgeTypeState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const isLoose = formData.get("isLoose") === "on";
    const input = {
      campaignId,
      name: formData.get("name"),
      installmentValue: formData.get("installmentValue"),
    };

    try {
      const db = createDbClient();
      const repository = createPledgeTypeRepository(db);
      const { id } = await createPledgeType(repository, input);
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "pledge_type_created",
        subjectName: toStringValue(input.name),
      });
      return { success: id };
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível criar o tipo de carnê. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          installmentValue: toStringValue(input.installmentValue),
          isLoose,
        },
      };
    }
  }

  return (
    <PageShell>
      <PageHeader backHref={`/campaigns/${campaignId}`} title="Tipos de carnê" />

      {pledgeTypes.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Nenhum tipo de carnê cadastrado ainda.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {pledgeTypes.map((pledgeType) => (
            <li
              key={pledgeType.id}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
            >
              <span className="text-[17px] font-semibold">{pledgeType.name}</span>
              <span className="text-[17px] text-zinc-700 dark:text-zinc-300">
                {pledgeType.installmentValue
                  ? `${formatCurrency(pledgeType.installmentValue)}/mês`
                  : "Valor livre"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canManageCampaigns ? <PledgeTypeForm action={create} /> : null}
    </PageShell>
  );
}
