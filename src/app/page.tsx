import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCampaigns } from "@/server/application/list-campaigns";
import { restoreCampaign } from "@/server/application/archive-campaign";
import { recordActivity } from "@/server/application/record-activity";
import { calculateCampaignProgressPercentage } from "@/server/domain/campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { SubmitButton } from "@/app/_components/submit-button";
import { PageShell } from "@/app/_components/page-shell";
import { roundIconButtonClassName } from "@/app/_components/page-header";
import { ProgressBar } from "@/app/_components/progress-bar";
import { ArrowPathIcon, ChevronRightIcon, MenuIcon, PlusIcon } from "@/app/_components/icons";
import { formatCurrency, formatMonthYear } from "@/app/_lib/format";

export default async function Home() {
  const session = await auth();
  const db = createDbClient();
  const repository = createCampaignRepository(db);
  const allCampaigns = await listCampaigns(repository);
  const campaigns = allCampaigns.filter((campaign) => campaign.active);
  const archivedCampaigns = allCampaigns.filter((campaign) => !campaign.active);

  async function restore(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageCampaigns) {
      redirect("/");
    }

    const campaignId = formData.get("campaignId");
    const campaignName = formData.get("campaignName");
    if (typeof campaignId !== "string" || typeof campaignName !== "string") {
      throw new Error("Campanha inválida");
    }

    const db = createDbClient();
    const repository = createCampaignRepository(db);
    await restoreCampaign(repository, campaignId);

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: actionSession.user.id,
      action: "campaign_restored",
      subjectName: campaignName,
      amountCents: null,
    });

    redirect("/");
  }

  return (
    <PageShell>
      <header className="flex items-center justify-between gap-4 pt-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Olá,</span>
          <span className="truncate text-2xl font-bold">{session?.user.name ?? "bem-vindo"}</span>
        </div>
        <Link href="/menu" aria-label="Abrir menu" className={roundIconButtonClassName}>
          <MenuIcon />
        </Link>
      </header>

      <h1 className="text-xl font-semibold">Suas campanhas</h1>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Nenhuma campanha ainda</h2>
          <p className="max-w-sm text-[15px] text-zinc-600 dark:text-zinc-400">
            Crie a primeira campanha de arrecadação para começar a cadastrar doadores e acompanhar a
            meta.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {campaigns.map((campaign) => {
            const progressPercentage = calculateCampaignProgressPercentage(
              campaign.raisedTotal,
              campaign.goal,
            );
            const goalReached = progressPercentage >= 100;

            return (
              <li key={campaign.id}>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="text-xl font-semibold break-words">{campaign.name}</h2>
                      <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                        até {formatMonthYear(campaign.endDate)}
                      </span>
                    </div>
                    <ChevronRightIcon className="h-6 w-6 shrink-0 text-zinc-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-3xl font-bold">
                        {formatCurrency(campaign.raisedTotal)}
                      </span>
                      <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                        de {formatCurrency(campaign.goal)}
                      </span>
                    </div>
                    <ProgressBar percentage={progressPercentage} />
                    <span
                      className={
                        goalReached
                          ? "text-[15px] font-semibold text-green-700 dark:text-green-400"
                          : "text-[15px] text-zinc-600 dark:text-zinc-400"
                      }
                    >
                      {goalReached ? "Meta alcançada" : `${String(progressPercentage)}% da meta`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {session?.user.canManageCampaigns ? (
        <Link
          href="/campaigns/new"
          className="flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-dashed border-zinc-400 text-[17px] font-semibold text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
        >
          <PlusIcon />
          Nova campanha
        </Link>
      ) : null}

      {archivedCampaigns.length > 0 ? (
        <details className="group flex flex-col gap-3">
          <summary className="flex min-h-11 cursor-pointer items-center justify-center text-[15px] text-zinc-700 underline dark:text-zinc-300">
            Ver campanhas arquivadas ({archivedCampaigns.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {archivedCampaigns.map((campaign) => (
              <li
                key={campaign.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              >
                <div className="flex flex-col">
                  <span className="text-[17px] font-semibold">{campaign.name}</span>
                  <span className="text-[15px]">até {formatMonthYear(campaign.endDate)}</span>
                </div>
                {session?.user.canManageCampaigns ? (
                  <form action={restore}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input type="hidden" name="campaignName" value={campaign.name} />
                    <SubmitButton pendingLabel="Reativando…" variant="outline">
                      <ArrowPathIcon className="h-5 w-5" />
                      Reativar
                    </SubmitButton>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </PageShell>
  );
}
