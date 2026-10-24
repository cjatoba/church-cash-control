import Link from "next/link";
import { auth } from "@/auth";
import { listPledges } from "@/server/application/list-pledges";
import { listLoosePledges } from "@/server/application/list-loose-pledges";
import { isPledgeClosed } from "@/server/domain/pledge";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
} from "@/app/_components/icons";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { formatCurrency } from "@/app/_lib/format";

type PledgeKindFilter = "fixed" | "loose";

function parsePledgeKindFilter(value: string | string[] | undefined): PledgeKindFilter | null {
  return value === "fixed" || value === "loose" ? value : null;
}

interface DonorPledgeRow {
  key: string;
  kind: PledgeKindFilter;
  donorId: string;
  donorName: string;
  subtitle: string;
  closed: boolean;
  href: string;
}

export default async function DonorsPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/donors">) {
  const session = await auth();
  const { id: campaignId } = await params;
  const kindFilter = parsePledgeKindFilter((await searchParams).show);
  const db = createDbClient();
  const pledgeRepository = createPledgeRepository(db);
  const loosePledgeRepository = createLoosePledgeRepository(db);
  const [pledges, loosePledges] = await Promise.all([
    kindFilter === "loose" ? [] : listPledges(pledgeRepository, campaignId),
    kindFilter === "fixed" ? [] : listLoosePledges(loosePledgeRepository, campaignId),
  ]);

  const rows: DonorPledgeRow[] = [
    ...pledges.map((pledge) => ({
      key: `pledge-${pledge.id}`,
      kind: "fixed" as const,
      donorId: pledge.donorId,
      donorName: pledge.donorName,
      subtitle: `Carnê ${pledge.pledgeTypeName} · pagou ${String(pledge.paidInstallments)} de ${String(pledge.totalInstallments)}`,
      closed: isPledgeClosed(pledge),
      href: `/campaigns/${campaignId}/pledges/${pledge.id}`,
    })),
    ...loosePledges.map((loosePledge) => ({
      key: `loose-pledge-${loosePledge.id}`,
      kind: "loose" as const,
      donorId: loosePledge.donorId,
      donorName: loosePledge.donorName,
      subtitle: `Carnê ${loosePledge.pledgeTypeName} · entregou ${formatCurrency(loosePledge.totalContributed)}`,
      closed: loosePledge.status === "closed",
      href: `/campaigns/${campaignId}/loose-pledges/${loosePledge.id}`,
    })),
  ]
    .filter((row) => kindFilter === null || !row.closed)
    .sort((a, b) => a.donorName.localeCompare(b.donorName, "pt-BR"));

  const choosingForPayment = kindFilter !== null;

  return (
    <PageShell>
      <PageHeader
        backHref={
          choosingForPayment ? `/campaigns/${campaignId}/receive` : `/campaigns/${campaignId}`
        }
        title={choosingForPayment ? "Escolha o doador" : "Doadores e carnês"}
        subtitle={
          kindFilter === "fixed"
            ? "Carnês de valor fixo em aberto"
            : kindFilter === "loose"
              ? "Carnês avulsos em aberto"
              : undefined
        }
      />

      {!choosingForPayment && session?.user.canReceiveFunds ? (
        <Link
          href={`/campaigns/${campaignId}/donors/new`}
          className={`${buttonBaseClassName} ${buttonClassNames.primary} w-full`}
        >
          <PlusIcon />
          Cadastrar doador
        </Link>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {choosingForPayment
            ? "Nenhum carnê desse tipo em aberto nesta campanha."
            : "Nenhum doador com carnê cadastrado ainda nesta campanha."}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col">
              <Link
                href={row.href}
                className="flex min-h-16 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[17px] font-semibold">{row.donorName}</span>
                  <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                    {row.subtitle}
                  </span>
                </span>
                <span
                  className={
                    row.closed
                      ? "flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }
                >
                  {row.closed ? (
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <ClockIcon className="h-4 w-4 shrink-0" />
                  )}
                  {row.closed ? "Fechado" : "Em aberto"}
                </span>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
              </Link>
              {choosingForPayment ? null : (
                <Link
                  href={`/campaigns/${campaignId}/donors/${row.donorId}`}
                  className="mx-4 mb-3 flex min-h-10 w-fit items-center gap-1.5 text-[15px] text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver dados do doador
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {choosingForPayment ? null : (
        <p className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
          &quot;Fechado&quot; quer dizer que todas as parcelas já foram pagas (carnê de valor fixo)
          ou que o carnê avulso foi encerrado.
        </p>
      )}
    </PageShell>
  );
}
