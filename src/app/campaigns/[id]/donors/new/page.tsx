import Link from "next/link";
import { redirect } from "next/navigation";
import { createDonor } from "@/server/application/create-donor";
import { createPledge } from "@/server/application/create-pledge";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDonorRepository } from "@/server/infrastructure/db/donor-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { DonorForm, type CreateDonorState } from "./donor-form";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function NewDonorPage({ params }: PageProps<"/campaigns/[id]/donors/new">) {
  const { id: campaignId } = await params;
  const db = createDbClient();
  const pledgeTypeRepository = createPledgeTypeRepository(db);
  const pledgeTypes = await listPledgeTypes(pledgeTypeRepository, campaignId);

  async function create(
    _prevState: CreateDonorState,
    formData: FormData,
  ): Promise<CreateDonorState> {
    "use server";

    try {
      const db = createDbClient();
      const donorRepository = createDonorRepository(db);
      const { id: donorId } = await createDonor(donorRepository, { name: formData.get("name") });

      const pledgeTypeRepository = createPledgeTypeRepository(db);
      const campaignRepository = createCampaignRepository(db);
      const pledgeRepository = createPledgeRepository(db);
      await createPledge(
        {
          campaignReader: campaignRepository,
          pledgeTypeReader: pledgeTypeRepository,
          pledgeRepository,
        },
        {
          campaignId,
          donorId,
          pledgeTypeId: formData.get("pledgeTypeId"),
        },
      );
    } catch {
      return { error: "Não foi possível cadastrar o doador. Confira os dados informados." };
    }

    redirect(`/campaigns/${campaignId}/donors`);
  }

  if (pledgeTypes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            Nenhum tipo de carnê cadastrado
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cadastre um tipo de carnê (ex.: valor da parcela) antes de vincular um doador.
          </p>
          <Link
            href={`/campaigns/${campaignId}/pledge-types`}
            className="self-center rounded-full bg-foreground px-5 py-2 text-sm text-background"
          >
            + Tipo de carnê
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <DonorForm
        campaignId={campaignId}
        pledgeTypes={pledgeTypes.map((pledgeType) => ({
          id: pledgeType.id,
          name: pledgeType.name,
          installmentValueLabel: currencyFormatter.format(
            pledgeType.installmentValue.toCents() / 100,
          ),
        }))}
        action={create}
      />
    </div>
  );
}
