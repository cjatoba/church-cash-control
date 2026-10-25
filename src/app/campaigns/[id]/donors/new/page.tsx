import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { createDonor } from "@/server/application/create-donor";
import { createPledge } from "@/server/application/create-pledge";
import { createLoosePledge } from "@/server/application/create-loose-pledge";
import { getCampaign } from "@/server/application/get-campaign";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { countRemainingInstallments } from "@/server/domain/pledge";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDonorRepository } from "@/server/infrastructure/db/donor-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { buildFirstMonthOptions } from "../../_lib/first-month-options";
import { DonorForm, type CreateDonorState } from "./donor-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMonthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", "/");
}

export default async function NewDonorPage({ params }: PageProps<"/campaigns/[id]/donors/new">) {
  const session = await auth();
  if (!session?.user.canReceiveFunds) {
    redirect("/");
  }

  const { id: campaignId } = await params;
  const db = createDbClient();
  const campaignRepository = createCampaignRepository(db);
  const pledgeTypeRepository = createPledgeTypeRepository(db);
  const [campaign, pledgeTypes] = await Promise.all([
    getCampaign(campaignRepository, campaignId),
    listPledgeTypes(pledgeTypeRepository, campaignId),
  ]);

  if (!campaign) {
    notFound();
  }

  const now = new Date();
  const firstMonthOptions = buildFirstMonthOptions(campaign, now);
  const maxInstallmentCount = countRemainingInstallments(now, campaign.endDate);

  async function create(
    _prevState: CreateDonorState,
    formData: FormData,
  ): Promise<CreateDonorState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const input = {
      name: formData.get("name"),
      pledgeTypeId: formData.get("pledgeTypeId"),
      installmentCountMode: formData.get("installmentCountMode"),
      installmentCount: formData.get("installmentCount"),
      firstInstallmentMonth: formData.get("firstInstallmentMonth"),
    };

    try {
      const db = createDbClient();
      const pledgeTypeRepository = createPledgeTypeRepository(db);
      const pledgeTypeId = toStringValue(input.pledgeTypeId);
      const pledgeType = await pledgeTypeRepository.findById(pledgeTypeId);

      const donorRepository = createDonorRepository(db);
      const { id: donorId } = await createDonor(donorRepository, { name: input.name });

      if (pledgeType?.installmentValue) {
        const campaignRepository = createCampaignRepository(db);
        const pledgeRepository = createPledgeRepository(db);
        const isCustomCount = input.installmentCountMode === "custom";
        await createPledge(
          {
            campaignReader: campaignRepository,
            pledgeTypeReader: pledgeTypeRepository,
            pledgeRepository,
          },
          {
            campaignId,
            donorId,
            pledgeTypeId,
            installmentCount: isCustomCount ? input.installmentCount : undefined,
            firstInstallmentMonth:
              typeof input.firstInstallmentMonth === "string"
                ? input.firstInstallmentMonth
                : undefined,
          },
        );
      } else {
        const loosePledgeRepository = createLoosePledgeRepository(db);
        await createLoosePledge(
          { pledgeTypeReader: pledgeTypeRepository, repository: loosePledgeRepository },
          { campaignId, donorId, pledgeTypeId },
        );
      }
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "donor_created",
        subjectName: toStringValue(input.name),
        donorId,
      });
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível cadastrar o doador. Confira os dados informados.",
        ),
        values: {
          name: toStringValue(input.name),
          pledgeTypeId: toStringValue(input.pledgeTypeId),
          installmentCountMode: toStringValue(input.installmentCountMode) || "full",
          installmentCount: toStringValue(input.installmentCount),
          firstInstallmentMonth: toStringValue(input.firstInstallmentMonth),
        },
      };
    }

    redirect(`/campaigns/${campaignId}/donors`);
  }

  if (pledgeTypes.length === 0) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Nenhum tipo de carnê cadastrado
          </h1>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
            Cadastre um tipo de carnê (com valor fixo ou avulso) antes de vincular um doador.
          </p>
          <Link
            href={`/campaigns/${campaignId}/pledge-types`}
            className="self-center inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Tipo de carnê
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
      <DonorForm
        campaignId={campaignId}
        pledgeTypes={pledgeTypes.map((pledgeType) => ({
          id: pledgeType.id,
          name: pledgeType.name,
          installmentValueLabel: pledgeType.installmentValue
            ? currencyFormatter.format(pledgeType.installmentValue.toCents() / 100)
            : null,
        }))}
        maxInstallmentCount={maxInstallmentCount}
        firstMonthOptions={firstMonthOptions}
        campaignEndMonthLabel={formatMonthLabel(campaign.endDate)}
        action={create}
      />
    </div>
  );
}
