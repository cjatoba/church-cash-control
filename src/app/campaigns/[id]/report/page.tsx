import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getCampaign } from "@/server/application/get-campaign";
import { getFundraisingReport } from "@/server/application/get-fundraising-report";
import {
  listReportMonths,
  resolveReportPeriod,
  type ChosenReportMonths,
} from "@/server/domain/fundraising-report";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createFundraisingReportRepository } from "@/server/infrastructure/db/fundraising-report-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { formatMonthYear } from "@/app/_lib/format";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { SkeletonCard } from "@/app/_components/page-skeleton";
import { Skeleton } from "@/app/_components/skeleton";
import { PrintButton } from "./_components/print-button";
import { DetailedReportSection, ReportDocument } from "./_components/report-document";
import { ReportOptions, type ReportVersion } from "./_components/report-options";

function monthParamValue(date: Date): string {
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonthParam(value: string | string[] | undefined): Date | null {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

const messageClassName =
  "rounded-2xl border border-zinc-200 bg-white p-5 text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";

async function ReportResult({
  campaignId,
  campaignName,
  chosenMonths,
  version,
  viewer,
}: {
  campaignId: string;
  campaignName: string;
  chosenMonths: ChosenReportMonths | null;
  version: ReportVersion;
  viewer: { name: string; canReceiveFunds: boolean };
}) {
  const db = createDbClient();
  const [report, branding] = await Promise.all([
    getFundraisingReport(
      {
        campaignReader: createCampaignRepository(db),
        reportReader: createFundraisingReportRepository(db),
        moneyInHandReader: createCustodyRepository(db),
      },
      campaignId,
      chosenMonths,
    ),
    getCachedAppBranding(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PrintButton />
      <ReportDocument
        appName={branding.name}
        campaignName={campaignName}
        generatedBy={viewer.name}
        report={report}
        detailed={
          version === "detailed" ? (
            <DetailedReportSection campaignId={campaignId} report={report} viewer={viewer} />
          ) : null
        }
      />
    </div>
  );
}

export default async function FundraisingReportPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/report">) {
  const { id: campaignId } = await params;
  const query = await searchParams;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const campaign = await getCampaign(createCampaignRepository(createDbClient()), campaignId);
  if (!campaign) {
    notFound();
  }

  const canSeeDetailed = session.user.canReceiveFunds;
  const campaignMonths = listReportMonths(resolveReportPeriod(campaign, null));
  const firstMonth = campaignMonths[0] ?? campaign.startDate;
  const lastMonth = campaignMonths.at(-1) ?? campaign.endDate;
  const from = parseMonthParam(query.from);
  const to = parseMonthParam(query.to);
  const chosenMonths = from && to ? { firstMonth: from, lastMonth: to } : null;
  const version: ReportVersion =
    query.version === "detailed" && canSeeDetailed ? "detailed" : "summary";

  let content;
  if (query.show !== "1") {
    content = (
      <p className={messageClassName}>
        Escolha o período{canSeeDetailed ? " e o que mostrar" : ""} e toque em &quot;Ver
        relatório&quot;. Depois é só imprimir ou salvar em PDF.
      </p>
    );
  } else {
    let periodError: string | null = null;
    try {
      resolveReportPeriod(campaign, chosenMonths);
    } catch (error) {
      periodError = toFriendlyErrorMessage(error, "Confira os meses escolhidos");
    }
    content = periodError ? (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      >
        {periodError}
      </p>
    ) : (
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full rounded-full" />
            <SkeletonCard lines={6} />
          </div>
        }
      >
        <ReportResult
          campaignId={campaignId}
          campaignName={campaign.name}
          chosenMonths={chosenMonths}
          version={version}
          viewer={{ name: session.user.name, canReceiveFunds: canSeeDetailed }}
        />
      </Suspense>
    );
  }

  return (
    <PageShell>
      <div className="print:hidden">
        <PageHeader
          backHref={`/campaigns/${campaignId}`}
          title="Relatório da arrecadação"
          subtitle={campaign.name}
        />
      </div>
      <ReportOptions
        monthOptions={campaignMonths.map((month) => ({
          value: monthParamValue(month),
          label: formatMonthYear(month),
        }))}
        initialValue={{
          wholeCampaign: chosenMonths === null,
          from: monthParamValue(from ?? firstMonth),
          to: monthParamValue(to ?? lastMonth),
          version,
        }}
        canSeeDetailed={canSeeDetailed}
      >
        {content}
      </ReportOptions>
    </PageShell>
  );
}
