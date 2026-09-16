import Link from "next/link";
import { auth } from "@/auth";
import { listLoosePledges } from "@/server/application/list-loose-pledges";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { CheckCircleIcon, ClockIcon, EyeIcon } from "@/app/_components/icons";
import { BackLink } from "@/app/_components/back-link";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function LoosePledgesPage({
  params,
}: PageProps<"/campaigns/[id]/loose-pledges">) {
  const session = await auth();
  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createLoosePledgeRepository(db);
  const loosePledges = await listLoosePledges(repository, campaignId);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <BackLink href="/" />
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Carnês avulsos</h1>
          {session?.user.canReceiveFunds ? (
            <Link
              href={`/campaigns/${campaignId}/loose-pledges/new`}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              + Carnê avulso
            </Link>
          ) : null}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Carnê sem valor fixo: o doador arrecada com quem quiser e entrega em uma ou mais vezes,
          até encerrar.
        </p>

        {loosePledges.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum carnê avulso cadastrado ainda nesta campanha.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {loosePledges.map((loosePledge) => {
              const closed = loosePledge.status === "closed";
              return (
                <li
                  key={loosePledge.id}
                  className="flex items-center justify-between gap-2 rounded border border-black/[.08] px-3 py-3 text-sm dark:border-white/[.16]"
                >
                  <Link
                    href={`/campaigns/${campaignId}/loose-pledges/${loosePledge.id}`}
                    className="flex flex-1 items-center justify-between gap-2 transition-colors hover:text-black dark:hover:text-zinc-50"
                  >
                    <span>
                      <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                        {loosePledge.donorName}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Arrecadado:{" "}
                        {currencyFormatter.format(loosePledge.totalContributed.toCents() / 100)}
                      </span>
                    </span>
                    <span
                      className={
                        closed
                          ? "flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }
                    >
                      {closed ? (
                        <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {closed ? "Encerrado" : "Aberto"}
                    </span>
                  </Link>
                  <Link
                    href={`/campaigns/${campaignId}/donors/${loosePledge.donorId}`}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    Ver dados
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
