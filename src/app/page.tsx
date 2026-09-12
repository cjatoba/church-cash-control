import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { listCampaigns } from "@/server/application/list-campaigns";
import { archiveCampaign, restoreCampaign } from "@/server/application/archive-campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { SubmitButton } from "@/app/_components/submit-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

export default async function Home({ searchParams }: PageProps<"/">) {
  const resolvedSearchParams = await searchParams;
  const campaignExtended = resolvedSearchParams.campaignExtended === "1";
  const session = await auth();
  const db = createDbClient();
  const repository = createCampaignRepository(db);
  const allCampaigns = await listCampaigns(repository);
  const campaigns = allCampaigns.filter((campaign) => campaign.active);
  const archivedCampaigns = allCampaigns.filter((campaign) => !campaign.active);

  async function logout(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  async function archive(formData: FormData): Promise<void> {
    "use server";

    const campaignId = formData.get("campaignId");
    if (typeof campaignId !== "string") {
      throw new Error("Campanha inválida");
    }

    const db = createDbClient();
    const repository = createCampaignRepository(db);
    await archiveCampaign(repository, campaignId);

    redirect("/");
  }

  async function restore(formData: FormData): Promise<void> {
    "use server";

    const campaignId = formData.get("campaignId");
    if (typeof campaignId !== "string") {
      throw new Error("Campanha inválida");
    }

    const db = createDbClient();
    const repository = createCampaignRepository(db);
    await restoreCampaign(repository, campaignId);

    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between gap-4 border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <span className="font-semibold text-black dark:text-zinc-50">Controle de Caixa</span>
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {session?.user.email ? <span>{session.user.email}</span> : null}
          <form action={logout}>
            <button type="submit" className="hover:text-black dark:hover:text-zinc-50">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        {campaignExtended ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <span>
              Período da campanha estendido. Carnês já existentes não foram alterados
              automaticamente — as parcelas continuam cobrindo só o período combinado originalmente
              com os doadores.
            </span>
            <Link href="/" className="whitespace-nowrap font-medium underline">
              Ok, entendi
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Campanhas</h1>
          <Link
            href="/campaigns/new"
            className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            + Nova campanha
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-black/[.08] bg-white p-12 text-center dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="font-semibold text-black dark:text-zinc-50">
              Nenhuma campanha cadastrada
            </h2>
            <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              Crie a primeira campanha de arrecadação para começar a organizar categorias de
              lançamento e acompanhar a meta.
            </p>
            <Link
              href="/campaigns/new"
              className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              + Nova campanha
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <div>
                  <h3 className="font-semibold text-black dark:text-zinc-50">{campaign.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {dateFormatter.format(campaign.startDate)} –{" "}
                    {dateFormatter.format(campaign.endDate)}
                  </p>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Meta:{" "}
                  <span className="font-semibold">
                    {currencyFormatter.format(campaign.goal.toCents() / 100)}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}/categories`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Categorias
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/pledge-types`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Tipos de carnê
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/donors`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Doadores
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/one-off-donations/new`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    + Doação avulsa
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/monthly`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Painel mensal
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/money-in-hand`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Dinheiro em mãos
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}/edit`}
                    className="self-start rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-black/[.14] dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-white/[.22]"
                  >
                    Editar
                  </Link>
                  <form action={archive}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <SubmitButton pendingLabel="Arquivando…">Arquivar</SubmitButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        {archivedCampaigns.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Campanhas arquivadas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {archivedCampaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-5 text-zinc-500 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400"
                >
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-xs">
                      {dateFormatter.format(campaign.startDate)} –{" "}
                      {dateFormatter.format(campaign.endDate)}
                    </p>
                  </div>
                  <form action={restore}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <SubmitButton pendingLabel="Reativando…">Reativar</SubmitButton>
                  </form>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
