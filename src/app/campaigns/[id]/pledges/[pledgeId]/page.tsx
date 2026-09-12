import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPledgeDetail } from "@/server/application/get-pledge-detail";
import { payInstallment } from "@/server/application/pay-installment";
import { correctInstallmentPaymentDate } from "@/server/application/correct-installment-payment-date";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PayInstallmentButton } from "../_components/pay-installment-button";
import { EditPaymentDateButton } from "../_components/edit-payment-date-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMonthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", "/");
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default async function PledgeDetailPage({
  params,
}: PageProps<"/campaigns/[id]/pledges/[pledgeId]">) {
  const { id: campaignId, pledgeId } = await params;
  const db = createDbClient();
  const pledgeRepository = createPledgeRepository(db);
  const pledge = await getPledgeDetail(pledgeRepository, pledgeId);

  if (!pledge) {
    notFound();
  }

  async function markInstallmentAsPaid(formData: FormData): Promise<void> {
    "use server";

    const installmentId = formData.get("installmentId");
    const paidAtValue = formData.get("paidAt");
    if (typeof installmentId !== "string" || typeof paidAtValue !== "string") {
      throw new Error("Dados inválidos para dar baixa na parcela");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    await payInstallment(
      { installmentReader: installmentRepository, installmentRepository },
      installmentId,
      new Date(paidAtValue),
    );

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  async function correctPaymentDate(formData: FormData): Promise<void> {
    "use server";

    const installmentId = formData.get("installmentId");
    const paidAtValue = formData.get("paidAt");
    if (typeof installmentId !== "string" || typeof paidAtValue !== "string") {
      throw new Error("Dados inválidos para corrigir a data de pagamento");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    await correctInstallmentPaymentDate(
      { installmentReader: installmentRepository, installmentRepository },
      installmentId,
      new Date(paidAtValue),
    );

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const paidCount = pledge.installments.filter((installment) => installment.paidAt).length;
  const totalCents = pledge.installments.length * pledge.installmentValue.toCents();
  const paidCents = pledge.installments.reduce(
    (sum, installment) => sum + (installment.paidAmount?.toCents() ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href={`/campaigns/${campaignId}/donors`}
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para doadores
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{pledge.donorName}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Carnê {pledge.pledgeTypeName} ·{" "}
            {currencyFormatter.format(pledge.installmentValue.toCents() / 100)}
            /mês · pago {currencyFormatter.format(paidCents / 100)} de{" "}
            {currencyFormatter.format(totalCents / 100)} ({paidCount} de{" "}
            {pledge.installments.length} parcelas)
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {pledge.installments.map((installment) => (
            <li
              key={installment.id}
              className="flex items-center justify-between rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
            >
              <span>
                {formatMonthLabel(installment.dueDate)} ·{" "}
                {currencyFormatter.format(installment.amount.toCents() / 100)}
              </span>
              {installment.paidAt ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Pago em {dateFormatter.format(installment.paidAt)}
                  </span>
                  <EditPaymentDateButton
                    installmentId={installment.id}
                    currentPaidAtIso={installment.paidAt.toISOString().slice(0, 10)}
                    todayIso={todayIso}
                    action={correctPaymentDate}
                  />
                </span>
              ) : (
                <PayInstallmentButton
                  installmentId={installment.id}
                  monthLabel={formatMonthLabel(installment.dueDate)}
                  amountLabel={currencyFormatter.format(installment.amount.toCents() / 100)}
                  todayIso={todayIso}
                  action={markInstallmentAsPaid}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
