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
  installment_paid: "deu baixa na parcela de",
  installment_payment_corrected: "corrigiu o pagamento da parcela de",
  installment_payment_reverted: "reverteu o pagamento da parcela de",
  campaign_created: "cadastrou a campanha",
  campaign_updated: "editou a campanha",
  campaign_archived: "arquivou a campanha",
  campaign_restored: "reativou a campanha",
  transaction_category_archived: "arquivou a categoria",
  transaction_category_restored: "reativou a categoria",
  pledge_type_created: "cadastrou o tipo de carnê",
  donor_created: "cadastrou o doador",
  donor_updated: "corrigiu o nome do doador",
  donor_anonymized: "excluiu os dados pessoais de",
  pledge_type_changed: "corrigiu o tipo de carnê de",
  one_off_donation_created: "registrou uma doação sem carnê de",
  one_off_donation_corrected: "corrigiu a doação sem carnê de",
  one_off_donation_deleted: "excluiu a doação sem carnê de",
  loose_contribution_created: "registrou uma entrega do carnê avulso de",
  loose_contribution_corrected: "corrigiu uma entrega do carnê avulso de",
  loose_contribution_deleted: "excluiu uma entrega do carnê avulso de",
  loose_pledge_closed: "encerrou o carnê avulso de",
  loose_pledge_reopened: "reabriu o carnê avulso de",
  custody_transfer_created: "registrou um repasse de",
  custody_transfer_corrected: "corrigiu o repasse de",
  custody_transfer_deleted: "excluiu o repasse de",
  user_invited: "cadastrou o voluntário",
  user_updated: "editou o cadastro de",
  user_access_activated: "liberou o acesso ao app para",
  user_password_reset: "gerou uma nova senha para",
  user_deactivated: "desativou",
  user_reactivated: "reativou",
  app_branding_updated: "personalizou o app:",
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
              <span className="text-[17px] leading-snug">
                <span className="font-semibold">{entry.actorLabel}</span>{" "}
                {actionLabels[entry.action]}{" "}
                <span className="font-semibold">{entry.subjectName}</span>
                {entry.amount ? (
                  <span className="font-semibold"> ({formatCurrency(entry.amount)})</span>
                ) : (
                  ""
                )}
              </span>
              {entry.details ? (
                <span className="self-start rounded-lg bg-zinc-100 px-2 py-1 text-[15px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {entry.details}
                </span>
              ) : null}
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
