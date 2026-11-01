import { Suspense, type ReactNode } from "react";
import {
  getDetailedFundraisingReport,
  type FundraisingReport,
} from "@/server/application/get-fundraising-report";
import type { ReportEntryKind } from "@/server/domain/fundraising-report";
import type { PaymentMethod } from "@/server/domain/payment-method";
import { createFundraisingReportRepository } from "@/server/infrastructure/db/fundraising-report-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { Skeleton } from "@/app/_components/skeleton";
import { formatDate, paymentMethodLabels } from "@/app/_lib/entry-change-details";
import { formatCurrency, formatMonthYear } from "@/app/_lib/format";

const kindLabels: Record<ReportEntryKind, string> = {
  installment: "Parcelas de carnê",
  loose_contribution: "Entregas de carnê avulso",
  one_off_donation: "Doações sem carnê",
};

const shortKindLabels: Record<ReportEntryKind, string> = {
  installment: "Parcela",
  loose_contribution: "Carnê avulso",
  one_off_donation: "Sem carnê",
};

function paymentMethodLabel(paymentMethod: PaymentMethod | null): string {
  return paymentMethod ? paymentMethodLabels[paymentMethod] : "Não informada";
}

const generatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function describePeriod(report: FundraisingReport): string {
  const { period } = report.summary;
  const months = `${formatMonthYear(period.firstMonth)} a ${formatMonthYear(period.lastMonth)}`;
  return period.wholeCampaign ? `campanha inteira (${months})` : months;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 border-b border-zinc-300 pb-1 text-sm font-bold tracking-wide uppercase break-after-avoid">
      {children}
    </h2>
  );
}

function AmountRow({
  label,
  amount,
  strong = false,
}: {
  label: ReactNode;
  amount: string;
  strong?: boolean;
}) {
  return (
    <tr className={strong ? "font-bold" : undefined}>
      <td className="py-1 pr-3">{label}</td>
      <td className="py-1 text-right whitespace-nowrap tabular-nums">{amount}</td>
    </tr>
  );
}

export function ReportDocument({
  appName,
  campaignName,
  generatedBy,
  report,
  detailed,
}: {
  appName: string;
  campaignName: string;
  generatedBy: string;
  report: FundraisingReport;
  detailed: ReactNode;
}) {
  const { summary } = report;

  return (
    <article className="rounded-2xl bg-white p-5 text-[13px] leading-snug text-zinc-900 shadow-sm sm:p-8 print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-zinc-900 pb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold break-words">{campaignName}</h1>
          <p>Relatório de arrecadação · {describePeriod(report)}</p>
        </div>
        <p className="text-xs text-zinc-600">
          {appName}
          <br />
          Gerado em {generatedAtFormatter.format(new Date())}
          <br />
          por {generatedBy}
        </p>
      </header>

      <SectionHeading>Resumo</SectionHeading>
      <table className="w-full">
        <tbody>
          <AmountRow
            label={summary.period.wholeCampaign ? "Meta da campanha" : "Meta dos meses escolhidos"}
            amount={formatCurrency(summary.goal)}
          />
          <AmountRow
            label={`Arrecadado (${String(summary.progressPercentage)}% da meta)`}
            amount={formatCurrency(summary.raised)}
            strong
          />
          <AmountRow label="Falta para a meta" amount={formatCurrency(summary.amountLeftToGoal)} />
        </tbody>
      </table>

      <SectionHeading>Por mês</SectionHeading>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-300 text-left">
            <th className="py-1 font-semibold">Mês</th>
            <th className="py-1 text-right font-semibold">Meta do mês</th>
            <th className="py-1 text-right font-semibold">Arrecadado</th>
          </tr>
        </thead>
        <tbody>
          {summary.byMonth.map((month) => (
            <tr key={month.month.toISOString()} className="break-inside-avoid">
              <td className="py-1">{formatMonthYear(month.month)}</td>
              <td className="py-1 text-right tabular-nums">
                {month.goal ? formatCurrency(month.goal) : "fora da campanha"}
              </td>
              <td className="py-1 text-right tabular-nums">{formatCurrency(month.raised)}</td>
            </tr>
          ))}
          <tr className="border-t border-zinc-300 font-bold">
            <td className="py-1">Total</td>
            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.goal)}</td>
            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.raised)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <SectionHeading>Por tipo de entrada</SectionHeading>
          <table className="w-full">
            <tbody>
              {summary.byKind.map((kind) => (
                <AmountRow
                  key={kind.kind}
                  label={`${kindLabels[kind.kind]} (${String(kind.count)})`}
                  amount={formatCurrency(kind.total)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <SectionHeading>Por forma de pagamento</SectionHeading>
          <table className="w-full">
            <tbody>
              {summary.byPaymentMethod.map((method) => (
                <AmountRow
                  key={method.paymentMethod ?? "unknown"}
                  label={paymentMethodLabel(method.paymentMethod)}
                  amount={formatCurrency(method.total)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SectionHeading>Para onde foi o dinheiro</SectionHeading>
      <table className="w-full">
        <tbody>
          <AmountRow
            label="Pago para fora da equipe (ex.: fornecedor) no período"
            amount={formatCurrency(report.paidOutsideTeam)}
          />
          <AmountRow
            label="Com a equipe hoje (dinheiro em mãos)"
            amount={formatCurrency(report.withTeam.total)}
          />
        </tbody>
      </table>
      {report.withTeam.holders.length > 0 ? (
        <p className="mt-1 text-xs text-zinc-600">
          Com a equipe hoje:{" "}
          {report.withTeam.holders
            .map((holder) => `${holder.userLabel} ${formatCurrency(holder.balance)}`)
            .join(" · ")}
        </p>
      ) : null}

      {detailed}

      <footer className="mt-8 border-t border-zinc-300 pt-2 text-[11px] text-zinc-500">
        {detailed ? (
          <strong>Contém nome de doadores: uso interno, não compartilhar.</strong>
        ) : (
          "Relatório resumido: não contém nome de doadores."
        )}
      </footer>
    </article>
  );
}

interface DetailedReportProps {
  campaignId: string;
  report: FundraisingReport;
  viewer: { canReceiveFunds: boolean };
}

export function DetailedReportSection(props: DetailedReportProps) {
  return (
    <Suspense
      fallback={
        <div className="mt-6 flex flex-col gap-2 print:hidden">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <DetailedEntries {...props} />
    </Suspense>
  );
}

async function DetailedEntries({ campaignId, report, viewer }: DetailedReportProps) {
  const detailed = await getDetailedFundraisingReport(
    createFundraisingReportRepository(createDbClient()),
    viewer,
    campaignId,
    report.summary.period,
    report.summary.entryCount,
  );

  if (detailed.status === "too_many_entries") {
    return (
      <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-900 print:hidden">
        Este período tem {detailed.entryCount.toLocaleString("pt-BR")} entradas. Para o relatório
        detalhado, escolha um período menor (até {detailed.limit.toLocaleString("pt-BR")} entradas).
        O resumo acima continua valendo para o período todo.
      </p>
    );
  }

  return (
    <>
      <SectionHeading>Entradas do período ({String(report.summary.entryCount)})</SectionHeading>
      {detailed.months.length === 0 ? (
        <p>Nenhuma entrada no período.</p>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-zinc-300 text-left">
              <th className="py-1 pr-2 font-semibold">Data</th>
              <th className="py-1 pr-2 font-semibold">Tipo</th>
              <th className="py-1 pr-2 font-semibold">Doador</th>
              <th className="py-1 pr-2 font-semibold">Forma</th>
              <th className="py-1 pr-2 font-semibold">Recebido por</th>
              <th className="py-1 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          {detailed.months.map((group) => (
            <tbody key={group.month.toISOString()}>
              {group.entries.map((entry, index) => (
                <tr
                  key={`${group.month.toISOString()}-${String(index)}`}
                  className="border-b border-zinc-100 break-inside-avoid"
                >
                  <td className="py-1 pr-2 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="py-1 pr-2">
                    {entry.dueDate
                      ? `${shortKindLabels[entry.kind]} ${formatMonthYear(entry.dueDate)}`
                      : shortKindLabels[entry.kind]}
                  </td>
                  <td className="py-1 pr-2 break-words">{entry.donorLabel ?? "Anônimo"}</td>
                  <td className="py-1 pr-2">{paymentMethodLabel(entry.paymentMethod)}</td>
                  <td className="py-1 pr-2">{entry.receivedByLabel ?? "—"}</td>
                  <td className="py-1 text-right whitespace-nowrap tabular-nums">
                    {formatCurrency(entry.amount)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={5} className="py-1 pr-2">
                  Subtotal de {formatMonthYear(group.month)}
                </td>
                <td className="py-1 text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(group.total)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      )}

      <SectionHeading>Repasses do período ({String(detailed.transfers.length)})</SectionHeading>
      {detailed.transfers.length === 0 ? (
        <p>Nenhum repasse no período.</p>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-zinc-300 text-left">
              <th className="py-1 pr-2 font-semibold">Data</th>
              <th className="py-1 pr-2 font-semibold">De</th>
              <th className="py-1 pr-2 font-semibold">Para</th>
              <th className="py-1 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {detailed.transfers.map((transfer, index) => (
              <tr key={String(index)} className="border-b border-zinc-100 break-inside-avoid">
                <td className="py-1 pr-2 whitespace-nowrap">{formatDate(transfer.date)}</td>
                <td className="py-1 pr-2">{transfer.fromLabel}</td>
                <td className="py-1 pr-2">
                  {transfer.toVolunteer ? `${transfer.toLabel} (voluntário)` : transfer.toLabel}
                </td>
                <td className="py-1 text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(transfer.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
