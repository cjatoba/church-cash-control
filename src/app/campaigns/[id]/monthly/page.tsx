import Link from "next/link";
import { notFound } from "next/navigation";
import { getMonthlyProgress } from "@/server/application/get-monthly-progress";
import { isMonthlyGoalReached } from "@/server/domain/monthly-progress";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createOneOffDonationRepository } from "@/server/infrastructure/db/one-off-donation-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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

function monthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", "/");
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
  const campaign = await campaignRepository.findById(campaignId);

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

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {monthLabel(month)}
          </h1>
          <form className="flex items-center gap-2">
            <select
              name="month"
              defaultValue={monthParamValue(month)}
              className="rounded border border-black/[.08] px-2 py-1 text-sm dark:border-white/[.145] dark:bg-black"
            >
              {months.map((option) => (
                <option key={monthParamValue(option)} value={monthParamValue(option)}>
                  {monthLabel(option)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
            >
              Ver
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Recebido:{" "}
              <span className="font-semibold text-black dark:text-zinc-50">
                {currencyFormatter.format(progress.receivedTotal.toCents() / 100)}
              </span>{" "}
              de {currencyFormatter.format(progress.monthlyGoal.toCents() / 100)}
            </span>
            <span
              className={
                goalReached
                  ? "font-medium text-green-700 dark:text-green-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {percentage}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.12]">
            <div
              className={
                goalReached
                  ? "h-full rounded-full bg-green-600"
                  : "h-full rounded-full bg-foreground"
              }
              style={{ width: `${String(Math.min(percentage, 100))}%` }}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-black dark:text-zinc-50">
            Pagaram em {monthLabel(month)}
          </h2>
          {progress.paid.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ninguém ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              {progress.paid.map((contribution, index) => (
                <li
                  key={`${contribution.donorName}-${String(index)}`}
                  className="flex justify-between"
                >
                  <span>{contribution.donorName}</span>
                  <span>{currencyFormatter.format(contribution.amount.toCents() / 100)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-black dark:text-zinc-50">
            Ainda não pagaram em {monthLabel(month)}
          </h2>
          {progress.pending.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ninguém — todos em dia.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              {progress.pending.map((contribution, index) => (
                <li
                  key={`${contribution.donorName}-${String(index)}`}
                  className="flex justify-between"
                >
                  <span>{contribution.donorName}</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {currencyFormatter.format(contribution.amount.toCents() / 100)} pendente
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
