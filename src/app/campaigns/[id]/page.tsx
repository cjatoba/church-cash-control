import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCampaignOverview } from "@/server/application/get-campaign-overview";
import { archiveCampaign } from "@/server/application/archive-campaign";
import { recordActivity } from "@/server/application/record-activity";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Card } from "@/app/_components/card";
import { ProgressBar } from "@/app/_components/progress-bar";
import { NavListAction, NavListItem, NavSection } from "@/app/_components/nav-list";
import { SubmitButton } from "@/app/_components/submit-button";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  PrinterIcon,
  CalendarIcon,
  DocumentIcon,
  PencilIcon,
  PlusIcon,
  UsersIcon,
} from "@/app/_components/icons";
import { formatCurrency, formatMonthYear } from "@/app/_lib/format";

export default async function CampaignPage({ params, searchParams }: PageProps<"/campaigns/[id]">) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id: campaignId } = await params;
  const campaignExtended = (await searchParams).campaignExtended === "1";
  const db = createDbClient();
  const campaign = await getCampaignOverview(createCampaignRepository(db), campaignId);

  if (!campaign) {
    notFound();
  }

  const campaignName = campaign.name;

  async function archive(): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const db = createDbClient();
    await archiveCampaign(createCampaignRepository(db), campaignId);
    await recordActivity(createActivityLogRepository(db), {
      actorUserId: actionSession.user.id,
      action: "campaign_archived",
      subjectName: campaignName,
      amountCents: null,
    });

    redirect("/");
  }

  const goalReached = campaign.progressPercentage >= 100;

  return (
    <PageShell>
      <PageHeader
        backHref="/"
        backLabel="Voltar para o início"
        title={campaign.name}
        subtitle={`${formatMonthYear(campaign.startDate)} – ${formatMonthYear(campaign.endDate)}`}
      />

      {campaignExtended ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span>
            Período da campanha estendido. Os carnês que já existiam não mudaram — as parcelas
            continuam cobrindo só o período combinado com os doadores.
          </span>
          <Link href={`/campaigns/${campaignId}`} className="self-start font-semibold underline">
            Ok, entendi
          </Link>
        </div>
      ) : null}

      {!campaign.active ? (
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 text-[15px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Esta campanha está arquivada. Para voltar a usá-la, reative pelo início.
        </div>
      ) : null}

      <Card>
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Arrecadado</span>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-3xl font-bold">{formatCurrency(campaign.raisedTotal)}</span>
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
            de {formatCurrency(campaign.goal)}
          </span>
        </div>
        <ProgressBar percentage={campaign.progressPercentage} />
        <span
          className={
            goalReached
              ? "text-[15px] font-semibold text-green-700 dark:text-green-400"
              : "text-[15px] text-zinc-600 dark:text-zinc-400"
          }
        >
          {goalReached
            ? "Meta alcançada"
            : `${String(campaign.progressPercentage)}% da meta · faltam ${formatCurrency(campaign.amountLeftToGoal)}`}
        </span>
      </Card>

      {session.user.canReceiveFunds && campaign.active ? (
        <Link
          href={`/campaigns/${campaignId}/receive`}
          className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
        >
          <PlusIcon className="h-6 w-6" />
          Registrar recebimento
        </Link>
      ) : null}

      <NavSection title="Acompanhar">
        <NavListItem
          href={`/campaigns/${campaignId}/monthly`}
          title="Quem pagou no mês"
          description="Pagamentos e pendências de cada mês"
          icon={<CalendarIcon />}
          iconTone="amber"
        />
        <NavListItem
          href={`/campaigns/${campaignId}/money-in-hand`}
          title="Dinheiro em mãos"
          description="Quem está com quanto e repasses"
          icon={<BanknotesIcon />}
          iconTone="green"
        />
        <NavListItem
          href={`/campaigns/${campaignId}/report`}
          title="Relatório da arrecadação"
          description="Totais da campanha para conferir, salvar ou imprimir"
          icon={<PrinterIcon />}
          iconTone="violet"
        />
      </NavSection>

      <NavSection title="Cadastros">
        <NavListItem
          href={`/campaigns/${campaignId}/donors`}
          title="Doadores e carnês"
          description="Cadastrar doador e ver os carnês"
          icon={<UsersIcon className="h-6 w-6" />}
          iconTone="blue"
        />
        <NavListItem
          href={`/campaigns/${campaignId}/pledge-types`}
          title="Tipos de carnê"
          description="Valores e modelos de carnê"
          icon={<DocumentIcon />}
        />
      </NavSection>

      {session.user.canManageCampaigns && campaign.active ? (
        <NavSection title="Configurações da campanha">
          <NavListItem
            href={`/campaigns/${campaignId}/edit`}
            title="Editar nome, meta e período"
            icon={<PencilIcon className="h-6 w-6" />}
          />
          <NavListAction>
            <form action={archive} className="flex px-4 py-3">
              <SubmitButton pendingLabel="Arquivando…" variant="outline">
                <ArchiveBoxIcon className="h-5 w-5" />
                Arquivar campanha
              </SubmitButton>
            </form>
          </NavListAction>
        </NavSection>
      ) : null}
    </PageShell>
  );
}
