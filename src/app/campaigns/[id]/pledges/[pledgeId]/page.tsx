import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPledgeDetail } from "@/server/application/get-pledge-detail";
import { payInstallment } from "@/server/application/pay-installment";
import { correctInstallmentPaymentDate } from "@/server/application/correct-installment-payment-date";
import { revertInstallmentPayment } from "@/server/application/revert-installment-payment";
import { listUsers } from "@/server/application/list-users";
import { recordActivity } from "@/server/application/record-activity";
import { parsePaymentMethod } from "@/server/domain/payment-method";
import { CheckCircleIcon, ClockIcon } from "@/app/_components/icons";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PayInstallmentButton } from "../_components/pay-installment-button";
import { EditPaymentDateButton } from "../_components/edit-payment-date-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
};

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
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const db = createDbClient();
  const pledgeRepository = createPledgeRepository(db);
  const userListRepository = createUserListRepository(db);
  const [pledge, users] = await Promise.all([
    getPledgeDetail(pledgeRepository, pledgeId),
    listUsers(userListRepository),
  ]);

  if (!pledge) {
    notFound();
  }

  async function markInstallmentAsPaid(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }
    const registeredByUserId = actionSession.user.id;

    const installmentId = formData.get("installmentId");
    const donorName = formData.get("donorName");
    const amountCentsValue = formData.get("amountCents");
    const paidAtValue = formData.get("paidAt");
    const paymentMethodValue = formData.get("paymentMethod");
    const receivedByUserId = formData.get("receivedByUserId");
    if (
      typeof installmentId !== "string" ||
      typeof donorName !== "string" ||
      typeof amountCentsValue !== "string" ||
      typeof paidAtValue !== "string" ||
      typeof receivedByUserId !== "string"
    ) {
      throw new Error("Dados inválidos para dar baixa na parcela");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    await payInstallment(
      { installmentReader: installmentRepository, installmentRepository },
      installmentId,
      new Date(paidAtValue),
      parsePaymentMethod(paymentMethodValue),
      receivedByUserId,
      registeredByUserId,
    );

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: registeredByUserId,
      action: "installment_paid",
      subjectName: donorName,
      amountCents: Number(amountCentsValue),
    });

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  async function correctPaymentDate(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const installmentId = formData.get("installmentId");
    const donorName = formData.get("donorName");
    const amountCentsValue = formData.get("amountCents");
    const paidAtValue = formData.get("paidAt");
    if (
      typeof installmentId !== "string" ||
      typeof donorName !== "string" ||
      typeof amountCentsValue !== "string" ||
      typeof paidAtValue !== "string"
    ) {
      throw new Error("Dados inválidos para corrigir a data de pagamento");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    await correctInstallmentPaymentDate(
      { installmentReader: installmentRepository, installmentRepository },
      installmentId,
      new Date(paidAtValue),
    );

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: actionSession.user.id,
      action: "installment_payment_corrected",
      subjectName: donorName,
      amountCents: Number(amountCentsValue),
    });

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  async function revertPayment(formData: FormData): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const installmentId = formData.get("installmentId");
    const donorName = formData.get("donorName");
    const amountCentsValue = formData.get("amountCents");
    if (
      typeof installmentId !== "string" ||
      typeof donorName !== "string" ||
      typeof amountCentsValue !== "string"
    ) {
      throw new Error("Parcela inválida");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    await revertInstallmentPayment(
      { installmentReader: installmentRepository, installmentRepository },
      installmentId,
    );

    const activityLogRepository = createActivityLogRepository(db);
    await recordActivity(activityLogRepository, {
      actorUserId: actionSession.user.id,
      action: "installment_payment_reverted",
      subjectName: donorName,
      amountCents: Number(amountCentsValue),
    });

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const paidCount = pledge.installments.filter((installment) => installment.paidAt).length;
  const totalCents = pledge.installments.length * pledge.installmentValue.toCents();
  const paidCents = pledge.installments.reduce(
    (sum, installment) => sum + (installment.paidAmount?.toCents() ?? 0),
    0,
  );
  const pledgeClosed = pledge.installments.length > 0 && paidCount === pledge.installments.length;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href={`/campaigns/${campaignId}/donors`}
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para doadores
        </Link>
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
              {pledge.donorName}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Carnê {pledge.pledgeTypeName} ·{" "}
              {currencyFormatter.format(pledge.installmentValue.toCents() / 100)}/mês
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Pago:{" "}
                <span className="text-base font-semibold text-black dark:text-zinc-50">
                  {currencyFormatter.format(paidCents / 100)}
                </span>{" "}
                de {currencyFormatter.format(totalCents / 100)}
              </span>
              <span
                className={
                  pledgeClosed
                    ? "font-medium text-green-700 dark:text-green-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }
              >
                {paidCount} de {pledge.installments.length}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.12]">
              <div
                className={
                  pledgeClosed
                    ? "h-full rounded-full bg-green-600"
                    : "h-full rounded-full bg-amber-500"
                }
                style={{
                  width: `${String(Math.round((paidCount / pledge.installments.length) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
          {pledge.installments.map((installment) => (
            <li
              key={installment.id}
              className="flex items-center justify-between rounded border border-black/[.08] px-3 py-3 text-sm dark:border-white/[.145]"
            >
              <span>
                {formatMonthLabel(installment.dueDate)} ·{" "}
                {currencyFormatter.format(installment.amount.toCents() / 100)}
              </span>
              {installment.paidAt ? (
                <span className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                      <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                      Pago em {dateFormatter.format(installment.paidAt)}
                      {installment.paymentMethod
                        ? ` · ${paymentMethodLabels[installment.paymentMethod] ?? installment.paymentMethod}`
                        : ""}
                      {installment.receivedByLabel
                        ? ` · Recebido por ${installment.receivedByLabel}`
                        : ""}
                    </span>
                    {session.user.canReceiveFunds ? (
                      <EditPaymentDateButton
                        installmentId={installment.id}
                        donorName={pledge.donorName}
                        amountCents={(installment.paidAmount ?? installment.amount).toCents()}
                        currentPaidAtIso={installment.paidAt.toISOString().slice(0, 10)}
                        todayIso={todayIso}
                        correctAction={correctPaymentDate}
                        revertAction={revertPayment}
                      />
                    ) : null}
                  </span>
                  {installment.registeredByLabel &&
                  installment.registeredByLabel !== installment.receivedByLabel ? (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      ⚠ Registrado por {installment.registeredByLabel}
                    </span>
                  ) : null}
                </span>
              ) : session.user.canReceiveFunds ? (
                <PayInstallmentButton
                  installmentId={installment.id}
                  donorName={pledge.donorName}
                  amountCents={installment.amount.toCents()}
                  monthLabel={formatMonthLabel(installment.dueDate)}
                  amountLabel={currencyFormatter.format(installment.amount.toCents() / 100)}
                  todayIso={todayIso}
                  users={users}
                  currentUserId={session.user.id}
                  action={markInstallmentAsPaid}
                />
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                  Pendente
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
