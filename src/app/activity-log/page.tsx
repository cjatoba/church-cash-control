import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { formatCurrency } from "@/app/_lib/format";
import { auth } from "@/auth";
import { listActivityLog } from "@/server/application/list-activity-log";
import type { ActivityLogAction } from "@/server/domain/activity-log";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const actionLabels: Record<ActivityLogAction, string> = {
  installment_paid: "Deu baixa na parcela de",
  installment_payment_corrected: "Corrigiu o pagamento da parcela de",
  installment_payment_reverted: "Reverteu o pagamento da parcela de",
  campaign_updated: "Editou a campanha",
  campaign_archived: "Arquivou a campanha",
  campaign_restored: "Reativou a campanha",
  transaction_category_archived: "Arquivou a categoria",
  transaction_category_restored: "Reativou a categoria",
};

export default async function ActivityLogPage() {
  const session = await auth();
  if (!session?.user.canManageUsers) {
    redirect("/");
  }

  const db = createDbClient();
  const repository = createActivityLogRepository(db);
  const entries = await listActivityLog(repository);

  return (
    <PageShell>
      <PageHeader backHref="/menu" title="Registro de atividades" />

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Nenhuma atividade registrada ainda.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {entries.map((entry, index) => (
            <li key={index} className="flex flex-col gap-1 px-4 py-3.5">
              <span className="text-[17px]">
                <span className="font-semibold">{entry.actorLabel}</span>{" "}
                {actionLabels[entry.action]}{" "}
                <span className="font-semibold">{entry.subjectName}</span>
                {entry.amount ? (
                  <span className="font-semibold"> ({formatCurrency(entry.amount)})</span>
                ) : (
                  ""
                )}
              </span>
              <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                {dateTimeFormatter.format(entry.occurredAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
