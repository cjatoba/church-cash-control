import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { describeChanges } from "@/server/domain/activity-log";
import { logActivity } from "@/app/_lib/log-activity";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
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
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Card, SectionTitle } from "@/app/_components/card";
import { ChevronRightIcon } from "@/app/_components/icons";
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

  const currentName = donor.name;

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
    const newName = formData.get("name");
    const trimmedName = typeof newName === "string" ? newName.trim() : "";
    await logActivity(db, {
      actorUserId: actionSession.user.id,
      action: "donor_updated",
      subjectName: trimmedName,
      donorId,
      details: describeChanges([{ label: "Nome", before: currentName, after: trimmedName }]),
    });

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
      {
        donorStateReader: donorRepository,
        donorAnonymizeRepository: donorRepository,
        activityRedactor: createActivityLogRepository(db),
      },
      donorId,
    );
    // Nunca o nome: a pessoa pediu para apagar os próprios dados.
    await logActivity(db, {
      actorUserId: actionSession.user.id,
      action: "donor_anonymized",
      subjectName: "um doador (nome removido)",
      donorId,
    });

    redirect(`/campaigns/${campaignId}/donors/${donorId}`);
  }

  return (
    <PageShell>
      <PageHeader backHref={`/campaigns/${campaignId}/donors`} title="Dados do doador" />

      <Card>
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Nome</span>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xl font-semibold break-words">{donor.name}</span>
          {session.user.canReceiveFunds && !donor.anonymizedAt ? (
            <EditDonorNameButton currentName={donor.name} action={saveName} />
          ) : null}
        </div>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionTitle>Carnês deste doador</SectionTitle>
        {pledgeRows.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Nenhum carnê cadastrado.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {pledgeRows.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  className="flex min-h-16 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[17px] font-semibold">
                      {row.campaignName} · {row.pledgeTypeName}
                    </span>
                    <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                      {row.subtitle}
                    </span>
                  </span>
                  <span
                    className={
                      row.closed
                        ? "shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }
                  >
                    {row.closed ? "Fechado" : "Em aberto"}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {session.user.canReceiveFunds && !donor.anonymizedAt ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>Excluir dados deste doador</SectionTitle>
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
              O nome é removido para sempre. O histórico de parcelas pagas continua, mas sem o nome.
            </p>
            <AnonymizeDonorButton action={removeData} />
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
