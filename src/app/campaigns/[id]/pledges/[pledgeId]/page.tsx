import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPledgeDetail } from "@/server/application/get-pledge-detail";
import { payInstallment } from "@/server/application/pay-installment";
import { correctInstallmentPayment } from "@/server/application/correct-installment-payment";
import { revertInstallmentPayment } from "@/server/application/revert-installment-payment";
import { listUsers } from "@/server/application/list-users";
import { recordActivity } from "@/server/application/record-activity";
import { parsePaymentMethod } from "@/server/domain/payment-method";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { describeEntryCorrection, toNameMap } from "@/app/_lib/entry-change-details";
import { CheckCircleIcon, ClockIcon, PencilIcon } from "@/app/_components/icons";
import { PageShell } from "@/app/_components/page-shell";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { PageHeader } from "@/app/_components/page-header";
import { Card } from "@/app/_components/card";
import { ProgressBar } from "@/app/_components/progress-bar";
import { Tabs } from "@/app/_components/tabs";
import { formatCurrency, formatMonthLabel } from "@/app/_lib/format";
import { Money } from "@/server/domain/money";
import { createInstallmentRepository } from "@/server/infrastructure/db/installment-repository";
import { createPledgeRepository } from "@/server/infrastructure/db/pledge-repository";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PayInstallmentButton } from "../_components/pay-installment-button";
import {
  CorrectPaymentButton,
  type CorrectPaymentState,
} from "../_components/correct-payment-button";

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export interface RevertPaymentState {
  error?: string;
}

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

  async function correctPayment(
    _prevState: CorrectPaymentState,
    formData: FormData,
  ): Promise<CorrectPaymentState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const installmentId = formData.get("installmentId");
    const donorName = formData.get("donorName");
    if (typeof installmentId !== "string" || typeof donorName !== "string") {
      throw new Error("Dados inválidos para corrigir o pagamento");
    }

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    try {
      const { before, after } = await correctInstallmentPayment(
        {
          installmentReader: installmentRepository,
          installmentRepository,
          balanceReader: createCustodyRepository(db),
        },
        campaignId,
        installmentId,
        {
          paidAt: formData.get("paidAt"),
          paymentMethod: formData.get("paymentMethod"),
          receivedByUserId: formData.get("receivedByUserId"),
        },
      );
      const names = toNameMap(await listUsers(createUserListRepository(db)));
      await recordActivity(createActivityLogRepository(db), {
        actorUserId: actionSession.user.id,
        action: "installment_payment_corrected",
        subjectName: donorName,
        amountCents: after.paidAmount.toCents(),
        details: describeEntryCorrection(
          {
            amount: before.amount,
            date: before.paidAt ?? after.paidAt,
            paymentMethod: before.paymentMethod,
            receivedByUserId: before.receivedByUserId,
          },
          {
            amount: after.paidAmount,
            date: after.paidAt,
            paymentMethod: after.paymentMethod,
            receivedByUserId: after.receivedByUserId,
          },
          names,
        ),
      });
    } catch (error) {
      return { error: toFriendlyErrorMessage(error, "Não foi possível corrigir o pagamento.") };
    }

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  async function revertPayment(
    _prevState: RevertPaymentState,
    formData: FormData,
  ): Promise<RevertPaymentState> {
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
    const custodyRepository = createCustodyRepository(db);
    try {
      await revertInstallmentPayment(
        {
          installmentReader: installmentRepository,
          installmentRepository,
          balanceReader: custodyRepository,
        },
        campaignId,
        installmentId,
      );
    } catch (error) {
      return { error: toFriendlyErrorMessage(error, "Não foi possível reverter o pagamento.") };
    }

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
  const progressPercentage =
    pledge.installments.length === 0
      ? 0
      : Math.round((paidCount / pledge.installments.length) * 100);
  const pendingInstallments = pledge.installments.filter((installment) => !installment.paidAt);
  const paidInstallments = pledge.installments
    .filter((installment) => installment.paidAt)
    .reverse();

  const pendingList =
    pendingInstallments.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhuma parcela a pagar — carnê quitado.
      </p>
    ) : (
      <ul className="flex flex-col gap-3">
        {pendingInstallments.map((installment) => (
          <li
            key={installment.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[17px] font-semibold">
                {formatMonthLabel(installment.dueDate)}
              </span>
              <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                {formatCurrency(installment.amount)}
              </span>
            </span>
            {session.user.canReceiveFunds ? (
              <PayInstallmentButton
                installmentId={installment.id}
                donorName={pledge.donorName}
                amountCents={installment.amount.toCents()}
                monthLabel={formatMonthLabel(installment.dueDate)}
                amountLabel={formatCurrency(installment.amount)}
                todayIso={todayIso}
                users={users}
                currentUserId={session.user.id}
                action={markInstallmentAsPaid}
              />
            ) : (
              <span className="flex items-center gap-1.5 text-[15px] font-medium text-amber-800 dark:text-amber-300">
                <ClockIcon className="h-5 w-5 shrink-0" />
                Pendente
              </span>
            )}
          </li>
        ))}
      </ul>
    );

  const paidList =
    paidInstallments.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhuma parcela paga ainda.
      </p>
    ) : (
      <ul className="flex flex-col gap-3">
        {paidInstallments.map((installment) =>
          installment.paidAt ? (
            <li
              key={installment.id}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[17px] font-semibold">
                  {formatMonthLabel(installment.dueDate)}
                </span>
                <span className="flex items-center gap-1.5 text-[15px] font-semibold text-green-700 dark:text-green-400">
                  <CheckCircleIcon className="h-5 w-5 shrink-0" />
                  Pago
                </span>
              </span>
              <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                {dateFormatter.format(installment.paidAt)}
                {installment.paymentMethod
                  ? ` · ${paymentMethodLabels[installment.paymentMethod] ?? installment.paymentMethod}`
                  : ""}
                {installment.receivedByLabel
                  ? ` · recebido por ${installment.receivedByLabel}`
                  : ""}
              </span>
              {installment.registeredByLabel &&
              installment.registeredByLabel !== installment.receivedByLabel ? (
                <span className="text-[15px] text-amber-800 dark:text-amber-300">
                  Registrado por {installment.registeredByLabel}
                </span>
              ) : null}
              {session.user.canReceiveFunds ? (
                <CorrectPaymentButton
                  installmentId={installment.id}
                  donorName={pledge.donorName}
                  amountCents={(installment.paidAmount ?? installment.amount).toCents()}
                  amountLabel={formatCurrency(installment.paidAmount ?? installment.amount)}
                  monthLabel={formatMonthLabel(installment.dueDate)}
                  currentPaidAtIso={installment.paidAt.toISOString().slice(0, 10)}
                  currentPaymentMethod={installment.paymentMethod ?? "pix"}
                  currentReceivedByUserId={installment.receivedByUserId ?? session.user.id}
                  users={users}
                  todayIso={todayIso}
                  correctAction={correctPayment}
                  revertAction={revertPayment}
                />
              ) : null}
            </li>
          ) : null,
        )}
      </ul>
    );

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}/donors`}
        title={pledge.donorName}
        subtitle={`Carnê ${pledge.pledgeTypeName} · ${formatCurrency(pledge.installmentValue)}/mês`}
      />

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Já pagou</span>
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
            {paidCount} de {pledge.installments.length} parcelas
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-bold">{formatCurrency(Money.fromCents(paidCents))}</span>
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
            de {formatCurrency(Money.fromCents(totalCents))}
          </span>
        </div>
        <ProgressBar percentage={progressPercentage} />
      </Card>

      <Tabs
        label="Parcelas"
        initialTabId={pendingInstallments.length > 0 ? "pending" : "paid"}
        tabs={[
          {
            id: "pending",
            label: `A pagar (${String(pendingInstallments.length)})`,
            content: pendingList,
          },
          { id: "paid", label: `Pagas (${String(paidInstallments.length)})`, content: paidList },
        ]}
      />
      {session.user.canReceiveFunds ? (
        <NavSection title="Ajustes do carnê">
          <NavListItem
            href={`/campaigns/${campaignId}/pledges/${pledgeId}/change-type`}
            title="Corrigir tipo de carnê"
            description="Use se escolheu o tipo errado no cadastro"
            icon={<PencilIcon className="h-6 w-6" />}
          />
        </NavSection>
      ) : null}
    </PageShell>
  );
}
