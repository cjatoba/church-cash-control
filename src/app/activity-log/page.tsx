import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listActivityLog } from "@/server/application/list-activity-log";
import type { ActivityLogAction } from "@/server/domain/activity-log";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Registro de atividades
        </h1>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <li
                key={index}
                className="flex flex-col gap-0.5 rounded border border-black/[.08] px-3 py-3 text-sm dark:border-white/[.145]"
              >
                <span className="text-zinc-900 dark:text-zinc-100">
                  <span className="font-medium">{entry.actorLabel}</span>{" "}
                  {actionLabels[entry.action]}{" "}
                  <span className="font-medium">{entry.subjectName}</span>
                  {entry.amount ? (
                    <span className="font-semibold">
                      {" "}
                      ({currencyFormatter.format(entry.amount.toCents() / 100)})
                    </span>
                  ) : (
                    ""
                  )}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {dateTimeFormatter.format(entry.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
