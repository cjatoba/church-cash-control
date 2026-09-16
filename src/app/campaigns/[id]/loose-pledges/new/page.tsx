import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createDonor } from "@/server/application/create-donor";
import { createLoosePledge } from "@/server/application/create-loose-pledge";
import { createDonorRepository } from "@/server/infrastructure/db/donor-repository";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { LoosePledgeForm, type CreateLoosePledgeState } from "./loose-pledge-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function NewLoosePledgePage({
  params,
}: PageProps<"/campaigns/[id]/loose-pledges/new">) {
  const session = await auth();
  if (!session?.user.canReceiveFunds) {
    redirect("/");
  }

  const { id: campaignId } = await params;

  async function create(
    _prevState: CreateLoosePledgeState,
    formData: FormData,
  ): Promise<CreateLoosePledgeState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const name = formData.get("name");

    try {
      const db = createDbClient();
      const donorRepository = createDonorRepository(db);
      const { id: donorId } = await createDonor(donorRepository, { name });

      const loosePledgeRepository = createLoosePledgeRepository(db);
      await createLoosePledge(loosePledgeRepository, { campaignId, donorId });
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível cadastrar o carnê avulso. Confira os dados informados.",
        ),
        values: { name: toStringValue(name) },
      };
    }

    redirect(`/campaigns/${campaignId}/loose-pledges`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <LoosePledgeForm campaignId={campaignId} action={create} />
    </div>
  );
}
