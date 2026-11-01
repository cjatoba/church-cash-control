import {
  canListDetailedEntries,
  DETAILED_REPORT_ENTRY_LIMIT,
  groupEntriesByMonth,
  resolveReportPeriod,
  summarizeFundraisingReport,
  summarizeMoneyWithTeam,
  toReportDateRange,
  type ChosenReportMonths,
  type FundraisingReportSummary,
  type MonthGroup,
  type MoneyWithTeam,
  type ReportAggregateRow,
  type ReportDateRange,
  type ReportEntryKind,
  type ReportPeriod,
} from "../domain/fundraising-report";
import { Money } from "../domain/money";
import type { PaymentMethod } from "../domain/payment-method";
import { getMoneyInHand, type MoneyInHandReader } from "./get-money-in-hand";
import type { CampaignGoalPeriodReader } from "./get-monthly-progress";

export interface FundraisingReportReader {
  sumEntries(campaignId: string, range: ReportDateRange | null): Promise<ReportAggregateRow[]>;
  sumPaidOutsideTeam(campaignId: string, range: ReportDateRange | null): Promise<number>;
}

export interface FundraisingReportDependencies {
  campaignReader: CampaignGoalPeriodReader;
  reportReader: FundraisingReportReader;
  moneyInHandReader: MoneyInHandReader;
}

export interface FundraisingReport {
  summary: FundraisingReportSummary;
  paidOutsideTeam: Money;
  withTeam: MoneyWithTeam;
}

export async function getFundraisingReport(
  dependencies: FundraisingReportDependencies,
  campaignId: string,
  chosenMonths: ChosenReportMonths | null,
): Promise<FundraisingReport> {
  const campaign = await dependencies.campaignReader.findById(campaignId);
  if (!campaign) {
    throw new Error("Campanha não encontrada");
  }
  const period = resolveReportPeriod(campaign, chosenMonths);
  const range = toReportDateRange(period);

  const [rows, paidOutsideTeamCents, balances] = await Promise.all([
    dependencies.reportReader.sumEntries(campaignId, range),
    dependencies.reportReader.sumPaidOutsideTeam(campaignId, range),
    getMoneyInHand(dependencies.moneyInHandReader, campaignId),
  ]);

  return {
    summary: summarizeFundraisingReport(campaign, period, rows),
    paidOutsideTeam: Money.fromCents(paidOutsideTeamCents),
    withTeam: summarizeMoneyWithTeam(balances),
  };
}

export interface ReportEntry {
  kind: ReportEntryKind;
  date: Date;
  donorLabel: string | null;
  paymentMethod: PaymentMethod | null;
  receivedByLabel: string | null;
  amount: Money;
  dueDate: Date | null;
}

export interface ReportTransfer {
  date: Date;
  fromLabel: string;
  toLabel: string;
  toVolunteer: boolean;
  amount: Money;
}

export interface DetailedReportReader {
  findEntries(campaignId: string, range: ReportDateRange | null): Promise<ReportEntry[]>;
  findTransfers(campaignId: string, range: ReportDateRange | null): Promise<ReportTransfer[]>;
}

export type DetailedFundraisingReport =
  | { status: "ready"; months: MonthGroup<ReportEntry>[]; transfers: ReportTransfer[] }
  | { status: "too_many_entries"; entryCount: number; limit: number };

// entryCount vem do resumo já calculado, para não contar as entradas de novo
// no banco antes de decidir se a lista cabe no relatório.
export async function getDetailedFundraisingReport(
  reader: DetailedReportReader,
  viewer: { canReceiveFunds: boolean },
  campaignId: string,
  period: ReportPeriod,
  entryCount: number,
): Promise<DetailedFundraisingReport> {
  if (!viewer.canReceiveFunds) {
    throw new Error("Só quem recebe arrecadação pode ver o relatório detalhado");
  }
  if (!canListDetailedEntries(entryCount)) {
    return { status: "too_many_entries", entryCount, limit: DETAILED_REPORT_ENTRY_LIMIT };
  }
  const range = toReportDateRange(period);
  const [entries, transfers] = await Promise.all([
    reader.findEntries(campaignId, range),
    reader.findTransfers(campaignId, range),
  ]);
  return {
    status: "ready",
    months: groupEntriesByMonth(entries),
    transfers: [...transfers].sort((a, b) => a.date.getTime() - b.date.getTime()),
  };
}
