import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { anonymizeDonor } from "@/server/application/anonymize-donor";
import { getDonor } from "@/server/application/get-donor";
import { listDonorPledges } from "@/server/application/list-donor-pledges";
import { listDonorLoosePledges } from "@/server/application/list-donor-loose-pledges";
import { updateDonor } from "@/server/application/update-donor";
import { isPledgeClosed } from "@/server/domain/pledge";
import { createDonorRepository } from "@/server/infrastructure/db/donor-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { BackLink } from "@/app/_components/back-link";
import { AnonymizeDonorButton } from "./_components/anonymize-donor-button";
import { EditDonorNameButton } from "./_components/edit-donor-name-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface DonorPledgeRow {
  key: string;
  campaignName: string;
  pledgeTypeName: string;
  subtitle: string;
  closed: boolean;
  href: string;
}

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
  const loosePledgeRepository = createLoosePledgeRepository(db);
  const [donor, donorPledges, donorLoosePledges] = await Promise.all([
    getDonor(donorRepository, donorId),
    listDonorPledges(pledgeRepository, donorId),
    listDonorLoosePledges(loosePledgeRepository, donorId),
  ]);

  if (!donor) {
    notFound();
  }

  const pledgeRows: DonorPledgeRow[] = [
    ...donorPledges.map((pledge) => ({
      key: `pledge-${pledge.id}`,
      campaignName: pledge.campaignName,
      pledgeTypeName: pledge.pledgeTypeName,
      subtitle: `pago ${String(pledge.paidInstallments)} de ${String(pledge.totalInstallments)}`,
      closed: isPledgeClosed(pledge),
      href: `/campaigns/${pledge.campaignId}/pledges/${pledge.id}`,
    })),
    ...donorLoosePledges.map((loosePledge) => ({
      key: `loose-pledge-${loosePledge.id}`,
      campaignName: loosePledge.campaignName,
      pledgeTypeName: loosePledge.pledgeTypeName,
      subtitle: `arrecadado ${currencyFormatter.format(loosePledge.totalContributed.toCents() / 100)}`,
      closed: loosePledge.status === "closed",
      href: `/campaigns/${loosePledge.campaignId}/loose-pledges/${loosePledge.id}`,
    })),
  ];

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
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <BackLink href={`/campaigns/${campaignId}/donors`} />
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Dados do doador</h1>

        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-900 dark:text-zinc-100">{donor.name}</span>
          {session.user.canReceiveFunds && !donor.anonymizedAt ? (
            <EditDonorNameButton currentName={donor.name} action={saveName} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Carnês deste doador
          </h2>
          {pledgeRows.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum carnê cadastrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pledgeRows.map((row) => (
                <li key={row.key}>
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm transition-colors hover:border-black/[.14] dark:border-white/[.16] dark:hover:border-white/[.22]"
                  >
                    <span>
                      <span className="block text-zinc-900 dark:text-zinc-100">
                        {row.campaignName} · {row.pledgeTypeName}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {row.subtitle}
                      </span>
                    </span>
                    <span
                      className={
                        row.closed
                          ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }
                    >
                      {row.closed ? "Fechado" : "Em aberto"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {session.user.canReceiveFunds && !donor.anonymizedAt ? (
          <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
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
