import { notFound } from "next/navigation";
import { getCampaign } from "@/server/application/get-campaign";
import { getMonthlyProgress } from "@/server/application/get-monthly-progress";
import { isMonthlyGoalReached } from "@/server/domain/monthly-progress";
import { MonthSelector } from "@/app/campaigns/[id]/monthly/_components/month-selector";
import { CheckCircleIcon, ClockIcon } from "@/app/_components/icons";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Card } from "@/app/_components/card";
import { ProgressBar } from "@/app/_components/progress-bar";
import { Tabs } from "@/app/_components/tabs";
import { formatCurrency, formatMonthLabel } from "@/app/_lib/format";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createOneOffDonationRepository } from "@/server/infrastructure/db/one-off-donation-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

function firstDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthParamValue(date: Date): string {
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonthParam(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function monthsBetween(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const cursor = firstDayOfMonth(startDate);
  const end = firstDayOfMonth(endDate);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function clampToPeriod(date: Date, startDate: Date, endDate: Date): Date {
  const start = firstDayOfMonth(startDate);
  const end = firstDayOfMonth(endDate);
  const current = firstDayOfMonth(date);
  if (current < start) return start;
  if (current > end) return end;
  return current;
}

export default async function MonthlyProgressPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/monthly">) {
  const { id: campaignId } = await params;
  const resolvedSearchParams = await searchParams;
  const db = createDbClient();
  const campaignRepository = createCampaignRepository(db);
  const campaign = await getCampaign(campaignRepository, campaignId);

  if (!campaign) {
    notFound();
  }

  const monthParam = resolvedSearchParams.month;
  const requestedMonth = typeof monthParam === "string" ? parseMonthParam(monthParam) : null;
  const month = clampToPeriod(requestedMonth ?? new Date(), campaign.startDate, campaign.endDate);

  const installmentRepository = createInstallmentRepository(db);
  const oneOffDonationRepository = createOneOffDonationRepository(db);
  const progress = await getMonthlyProgress(
    {
      campaignReader: campaignRepository,
      installmentsReader: installmentRepository,
      oneOffDonationsReader: oneOffDonationRepository,
    },
    campaignId,
    month,
  );

  const goalReached = isMonthlyGoalReached(progress);
  const percentage = Math.round(
    (progress.receivedTotal.toCents() / progress.monthlyGoal.toCents()) * 100,
  );
  const months = monthsBetween(campaign.startDate, campaign.endDate);

  const paidList =
    progress.paid.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Ninguém pagou neste mês ainda.
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {progress.paid.map((contribution, index) => (
          <li
            key={`${contribution.donorName}-${String(index)}`}
            className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-[17px]">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
              {contribution.donorName}
            </span>
            <span className="text-[17px] font-semibold">{formatCurrency(contribution.amount)}</span>
          </li>
        ))}
      </ul>
    );

  const pendingList =
    progress.pending.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Ninguém — todos em dia neste mês.
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {progress.pending.map((contribution, index) => (
          <li
            key={`${contribution.donorName}-${String(index)}`}
            className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-[17px]">
              <ClockIcon className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
              {contribution.donorName}
            </span>
            <span className="text-[17px] font-semibold text-amber-800 dark:text-amber-300">
              {formatCurrency(contribution.amount)}
            </span>
          </li>
        ))}
      </ul>
    );

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}`}
        title="Quem pagou no mês"
        subtitle={campaign.name}
      />

      <MonthSelector
        selectedValue={monthParamValue(month)}
        options={months.map((option) => ({
          value: monthParamValue(option),
          label: formatMonthLabel(option),
        }))}
      >
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Recebido no mês</span>
            <span
              className={
                goalReached
                  ? "text-[15px] font-semibold text-green-700 dark:text-green-400"
                  : "text-[15px] text-zinc-600 dark:text-zinc-400"
              }
            >
              {percentage}% da meta do mês
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-bold">{formatCurrency(progress.receivedTotal)}</span>
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
              de {formatCurrency(progress.monthlyGoal)}
            </span>
          </div>
          <ProgressBar percentage={percentage} />
        </Card>

        <Tabs
          label="Doadores do mês"
          initialTabId={progress.pending.length > 0 ? "pending" : "paid"}
          tabs={[
            {
              id: "pending",
              label: `Faltam (${String(progress.pending.length)})`,
              content: pendingList,
            },
            { id: "paid", label: `Pagaram (${String(progress.paid.length)})`, content: paidList },
          ]}
        />
      </MonthSelector>
    </PageShell>
  );
}
