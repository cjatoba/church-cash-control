import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { anonymizeDonor } from "@/server/application/anonymize-donor";
import { getDonor } from "@/server/application/get-donor";
import { listDonorPledges } from "@/server/application/list-donor-pledges";
import { updateDonor } from "@/server/application/update-donor";
import { isPledgeClosed } from "@/server/domain/pledge";
import { createDonorRepository } from "@/server/infrastructure/db/donor-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { AnonymizeDonorButton } from "./_components/anonymize-donor-button";
import { EditDonorNameButton } from "./_components/edit-donor-name-button";

export default async function DonorDetailPage({
  params,
}: PageProps<"/campaigns/[id]/donors/[donorId]">) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id: campaignId, donorId } = await params;
  const db = createDbClient();
  const donorRepository = createDonorRepository(db);
  const pledgeRepository = createPledgeRepository(db);
  const [donor, donorPledges] = await Promise.all([
    getDonor(donorRepository, donorId),
    listDonorPledges(pledgeRepository, donorId),
  ]);

  if (!donor) {
    notFound();
  }

  async function saveName(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    const donorRepository = createDonorRepository(db);
    await updateDonor(
      { donorStateReader: donorRepository, donorUpdateRepository: donorRepository },
      donorId,
      { name: formData.get("name") },
    );

    redirect(`/campaigns/${campaignId}/donors/${donorId}`);
  }

  async function removeData(): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    const donorRepository = createDonorRepository(db);
    await anonymizeDonor(
      { donorStateReader: donorRepository, donorAnonymizeRepository: donorRepository },
      donorId,
    );

    redirect(`/campaigns/${campaignId}/donors/${donorId}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href={`/campaigns/${campaignId}/donors`}
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para doadores
        </Link>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Dados do doador</h1>

        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-900 dark:text-zinc-100">{donor.name}</span>
          {session.user.canReceiveFunds && !donor.anonymizedAt ? (
            <EditDonorNameButton currentName={donor.name} action={saveName} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Carnês deste doador
          </h2>
          {donorPledges.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum carnê cadastrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {donorPledges.map((pledge) => {
                const closed = isPledgeClosed(pledge);
                return (
                  <li key={pledge.id}>
                    <Link
                      href={`/campaigns/${pledge.campaignId}/pledges/${pledge.id}`}
                      className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:hover:border-white/[.22]"
                    >
                      <span>
                        <span className="block text-zinc-900 dark:text-zinc-100">
                          {pledge.campaignName} · {pledge.pledgeTypeName}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          pago {pledge.paidInstallments} de {pledge.totalInstallments}
                        </span>
                      </span>
                      <span
                        className={
                          closed
                            ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        }
                      >
                        {closed ? "Fechado" : "Em aberto"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {session.user.canReceiveFunds && !donor.anonymizedAt ? (
          <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Excluir dados deste doador
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              O nome é removido permanentemente. O histórico de parcelas pagas é mantido, sem
              vínculo com o nome.
            </p>
            <AnonymizeDonorButton action={removeData} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
