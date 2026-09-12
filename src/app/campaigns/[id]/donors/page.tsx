import Link from "next/link";
import { listPledges } from "@/server/application/list-pledges";
import { isPledgeClosed } from "@/server/domain/pledge";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

export default async function DonorsPage({ params }: PageProps<"/campaigns/[id]/donors">) {
  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createPledgeRepository(db);
  const pledges = await listPledges(repository, campaignId);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Doadores</h1>
          <Link
            href={`/campaigns/${campaignId}/donors/new`}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs text-background"
          >
            + Doador
          </Link>
        </div>

        {pledges.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum doador com carnê cadastrado ainda nesta campanha.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pledges.map((pledge) => {
              const closed = isPledgeClosed(pledge);
              return (
                <li
                  key={pledge.id}
                  className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
                >
                  <span>
                    <span className="block text-zinc-900 dark:text-zinc-100">
                      {pledge.donorName}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Carnê {pledge.pledgeTypeName} · pago {pledge.paidInstallments} de{" "}
                      {pledge.totalInstallments}
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
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          &quot;Fechado&quot; = todas as parcelas do carnê já foram pagas — não entra mais nas
          cobranças dos próximos meses.
        </p>
      </div>
    </div>
  );
}
