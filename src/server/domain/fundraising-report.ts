import { calculateMonthlyGoal, countMonthsInPeriod } from "./monthly-progress";
import { Money } from "./money";
import { paymentMethods, type PaymentMethod } from "./payment-method";

export const reportEntryKinds = ["installment", "loose_contribution", "one_off_donation"] as const;
export type ReportEntryKind = (typeof reportEntryKinds)[number];

// Acima disso a versão detalhada vira dezenas de páginas e o próprio
// navegador do celular sofre para montar a impressão — o limite é do papel,
// não do banco (a versão resumida só usa somas e não tem limite).
export const DETAILED_REPORT_ENTRY_LIMIT = 2000;

export interface ReportPeriod {
  firstMonth: Date;
  lastMonth: Date;
  wholeCampaign: boolean;
}

export interface ChosenReportMonths {
  firstMonth: Date;
  lastMonth: Date;
}

export interface ReportCampaign {
  goal: Money;
  startDate: Date;
  endDate: Date;
}

export interface ReportDateRange {
  from: Date;
  until: Date;
}

export interface ReportAggregateRow {
  month: Date;
  kind: ReportEntryKind;
  paymentMethod: PaymentMethod | null;
  totalCents: number;
  count: number;
}

export interface ReportMonthTotal {
  month: Date;
  goal: Money | null;
  raised: Money;
}

export interface ReportKindTotal {
  kind: ReportEntryKind;
  count: number;
  total: Money;
}

export interface ReportPaymentMethodTotal {
  paymentMethod: PaymentMethod | null;
  total: Money;
}

export interface FundraisingReportSummary {
  period: ReportPeriod;
  goal: Money;
  raised: Money;
  progressPercentage: number;
  amountLeftToGoal: Money;
  entryCount: number;
  byMonth: ReportMonthTotal[];
  byKind: ReportKindTotal[];
  byPaymentMethod: ReportPaymentMethodTotal[];
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(month: Date, amount: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1));
}

export function resolveReportPeriod(
  campaign: Pick<ReportCampaign, "startDate" | "endDate">,
  chosen: ChosenReportMonths | null,
): ReportPeriod {
  const campaignFirstMonth = startOfMonth(campaign.startDate);
  const campaignLastMonth = startOfMonth(campaign.endDate);
  if (!chosen) {
    return { firstMonth: campaignFirstMonth, lastMonth: campaignLastMonth, wholeCampaign: true };
  }

  const firstMonth = startOfMonth(chosen.firstMonth);
  const lastMonth = startOfMonth(chosen.lastMonth);
  if (firstMonth < campaignFirstMonth || lastMonth > campaignLastMonth) {
    throw new Error("Escolha meses dentro do período da campanha");
  }
  if (firstMonth > lastMonth) {
    throw new Error('O mês de "De" precisa vir antes do mês de "Até"');
  }
  return {
    firstMonth,
    lastMonth,
    wholeCampaign:
      firstMonth.getTime() === campaignFirstMonth.getTime() &&
      lastMonth.getTime() === campaignLastMonth.getTime(),
  };
}

export function listReportMonths(period: Pick<ReportPeriod, "firstMonth" | "lastMonth">): Date[] {
  const count = countMonthsInPeriod(period.firstMonth, period.lastMonth);
  return Array.from({ length: count }, (_, index) => addMonths(period.firstMonth, index));
}

// Campanha inteira não filtra por data: uma entrada registrada fora dos
// meses da campanha ainda conta no "Arrecadado" do painel, e o relatório
// precisa bater com ele.
export function toReportDateRange(period: ReportPeriod): ReportDateRange | null {
  if (period.wholeCampaign) {
    return null;
  }
  return { from: period.firstMonth, until: addMonths(period.lastMonth, 1) };
}

function sumCents(rows: ReportAggregateRow[]): number {
  return rows.reduce((sum, row) => sum + row.totalCents, 0);
}

function summarizeByMonth(
  periodMonths: Date[],
  monthlyGoal: Money,
  rows: ReportAggregateRow[],
): ReportMonthTotal[] {
  const raisedByMonth = new Map<number, number>();
  for (const row of rows) {
    const key = startOfMonth(row.month).getTime();
    raisedByMonth.set(key, (raisedByMonth.get(key) ?? 0) + row.totalCents);
  }
  const periodKeys = new Set(periodMonths.map((month) => month.getTime()));
  const allKeys = [...new Set([...periodKeys, ...raisedByMonth.keys()])].sort((a, b) => a - b);

  return allKeys.map((key) => ({
    month: new Date(key),
    goal: periodKeys.has(key) ? monthlyGoal : null,
    raised: Money.fromCents(raisedByMonth.get(key) ?? 0),
  }));
}

function summarizeByKind(rows: ReportAggregateRow[]): ReportKindTotal[] {
  return reportEntryKinds.map((kind) => {
    const kindRows = rows.filter((row) => row.kind === kind);
    return {
      kind,
      count: kindRows.reduce((sum, row) => sum + row.count, 0),
      total: Money.fromCents(sumCents(kindRows)),
    };
  });
}

function summarizeByPaymentMethod(rows: ReportAggregateRow[]): ReportPaymentMethodTotal[] {
  const known = paymentMethods.map((paymentMethod) => ({
    paymentMethod,
    total: Money.fromCents(sumCents(rows.filter((row) => row.paymentMethod === paymentMethod))),
  }));
  const unknownCents = sumCents(rows.filter((row) => row.paymentMethod === null));
  return unknownCents > 0
    ? [...known, { paymentMethod: null, total: Money.fromCents(unknownCents) }]
    : known;
}

export function summarizeFundraisingReport(
  campaign: ReportCampaign,
  period: ReportPeriod,
  rows: ReportAggregateRow[],
): FundraisingReportSummary {
  const monthlyGoal = calculateMonthlyGoal(campaign.goal, campaign.startDate, campaign.endDate);
  const periodMonths = listReportMonths(period);
  const goal = period.wholeCampaign
    ? campaign.goal
    : Money.fromCents(monthlyGoal.toCents() * periodMonths.length);
  const raised = Money.fromCents(sumCents(rows));

  return {
    period,
    goal,
    raised,
    progressPercentage:
      goal.toCents() === 0 ? 0 : Math.round((raised.toCents() / goal.toCents()) * 100),
    amountLeftToGoal:
      raised.toCents() >= goal.toCents() ? Money.fromCents(0) : goal.subtract(raised),
    entryCount: rows.reduce((sum, row) => sum + row.count, 0),
    byMonth: summarizeByMonth(periodMonths, monthlyGoal, rows),
    byKind: summarizeByKind(rows),
    byPaymentMethod: summarizeByPaymentMethod(rows),
  };
}

export function canListDetailedEntries(entryCount: number): boolean {
  return entryCount <= DETAILED_REPORT_ENTRY_LIMIT;
}

export interface MoneyHolder {
  userLabel: string;
  balance: Money;
}

export interface MoneyWithTeam {
  total: Money;
  holders: MoneyHolder[];
}

export function summarizeMoneyWithTeam(balances: MoneyHolder[]): MoneyWithTeam {
  const holders = balances
    .filter((holder) => holder.balance.toCents() > 0)
    .sort((a, b) => b.balance.toCents() - a.balance.toCents());
  return {
    total: holders.reduce((sum, holder) => sum.add(holder.balance), Money.fromCents(0)),
    holders,
  };
}

export interface MonthGroup<Entry> {
  month: Date;
  entries: Entry[];
  total: Money;
}

export function groupEntriesByMonth<Entry extends { date: Date; amount: Money }>(
  entries: Entry[],
): MonthGroup<Entry>[] {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const groups: MonthGroup<Entry>[] = [];
  for (const entry of sorted) {
    const month = startOfMonth(entry.date);
    const current = groups.at(-1);
    if (current?.month.getTime() === month.getTime()) {
      current.entries.push(entry);
      current.total = current.total.add(entry.amount);
    } else {
      groups.push({ month, entries: [entry], total: entry.amount });
    }
  }
  return groups;
}
