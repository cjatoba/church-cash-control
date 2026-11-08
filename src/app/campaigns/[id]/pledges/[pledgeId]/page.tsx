import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPledgeDetail } from "@/server/application/get-pledge-detail";
import { payInstallment } from "@/server/application/pay-installment";
import { correctInstallmentPayment } from "@/server/application/correct-installment-payment";
import { revertInstallmentPayment } from "@/server/application/revert-installment-payment";
import { listUsers } from "@/server/application/list-users";
import { recordActivity } from "@/server/application/record-activity";
import { remainingToPay, sumPaid } from "@/server/domain/installment";
import type { InstallmentDetail } from "@/server/domain/pledge";
import { toActionErrorState, type ActionErrorState } from "@/app/_lib/action-error-message";
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
import {
  PayInstallmentButton,
  type PayInstallmentState,
} from "../_components/pay-installment-button";
import {
  CorrectPaymentButton,
  type CorrectPaymentState,
} from "../_components/correct-payment-button";

const paymentMethodLabels = {
  pix: "Pix",
  cash: "Dinheiro",
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export type RevertPaymentState = ActionErrorState;

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

  const pledgeDonorId = pledge.donorId;

  function readText(formData: FormData, name: string): string {
    const value = formData.get(name);
    if (typeof value !== "string") {
      throw new Error("Dados inválidos para o pagamento da parcela");
    }
    return value;
  }

  function describeRemaining(remaining: Money): string | null {
    return remaining.toCents() > 0
      ? `Pagamento em parte: falta ${formatCurrency(remaining)}`
      : null;
  }

  async function markInstallmentAsPaid(
    _prevState: PayInstallmentState,
    formData: FormData,
  ): Promise<PayInstallmentState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }
    const registeredByUserId = actionSession.user.id;
    const installmentId = readText(formData, "installmentId");
    const donorName = readText(formData, "donorName");

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    try {
      const { payment, remaining } = await payInstallment(
        { installmentReader: installmentRepository, paymentWriter: installmentRepository },
        installmentId,
        {
          amount: formData.get("amount"),
          paidAt: formData.get("paidAt"),
          paymentMethod: formData.get("paymentMethod"),
          receivedByUserId: formData.get("receivedByUserId"),
        },
        registeredByUserId,
      );
      await recordActivity(createActivityLogRepository(db), {
        actorUserId: registeredByUserId,
        action: "installment_paid",
        subjectName: donorName,
        donorId: pledgeDonorId,
        amountCents: payment.amount.toCents(),
        details: describeRemaining(remaining),
      });
    } catch (error) {
      return toActionErrorState(error, "Não foi possível registrar o pagamento.", campaignId);
    }

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
    const installmentId = readText(formData, "installmentId");
    const paymentId = readText(formData, "paymentId");
    const donorName = readText(formData, "donorName");

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    try {
      const { before, after } = await correctInstallmentPayment(
        {
          installmentReader: installmentRepository,
          paymentWriter: installmentRepository,
          balanceReader: createCustodyRepository(db),
        },
        campaignId,
        installmentId,
        paymentId,
        {
          amount: formData.get("amount"),
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
        donorId: pledgeDonorId,
        amountCents: after.amount.toCents(),
        details: describeEntryCorrection(
          {
            amount: before.amount,
            date: before.paidAt,
            paymentMethod: before.paymentMethod,
            receivedByUserId: before.receivedByUserId,
          },
          {
            amount: after.amount,
            date: after.paidAt,
            paymentMethod: after.paymentMethod,
            receivedByUserId: after.receivedByUserId,
          },
          names,
        ),
      });
    } catch (error) {
      return toActionErrorState(error, "Não foi possível corrigir o pagamento.", campaignId);
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
    const installmentId = readText(formData, "installmentId");
    const paymentId = readText(formData, "paymentId");
    const donorName = readText(formData, "donorName");

    const db = createDbClient();
    const installmentRepository = createInstallmentRepository(db);
    try {
      const { removed, remaining } = await revertInstallmentPayment(
        {
          installmentReader: installmentRepository,
          paymentWriter: installmentRepository,
          balanceReader: createCustodyRepository(db),
        },
        campaignId,
        installmentId,
        paymentId,
      );
      await recordActivity(createActivityLogRepository(db), {
        actorUserId: actionSession.user.id,
        action: "installment_payment_reverted",
        subjectName: donorName,
        donorId: pledgeDonorId,
        amountCents: removed.amount.toCents(),
        details: describeRemaining(remaining),
      });
    } catch (error) {
      return toActionErrorState(error, "Não foi possível excluir o pagamento.", campaignId);
    }

    redirect(`/campaigns/${campaignId}/pledges/${pledgeId}`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const canReceiveFunds = session.user.canReceiveFunds;

  const installmentStates = pledge.installments.map((installment) => {
    const state = { amount: installment.amount, payments: installment.payments };
    return { installment, paid: sumPaid(state), remaining: remainingToPay(state) };
  });
  const paidCount = installmentStates.filter(({ remaining }) => remaining.toCents() === 0).length;
  const totalCents = pledge.installments.reduce(
    (sum, installment) => sum + installment.amount.toCents(),
    0,
  );
  const paidCents = installmentStates.reduce((sum, { paid }) => sum + paid.toCents(), 0);
  const progressPercentage =
    pledge.installments.length === 0
      ? 0
      : Math.round((paidCount / pledge.installments.length) * 100);
  const pendingInstallments = installmentStates.filter(({ remaining }) => remaining.toCents() > 0);
  const paidInstallments = installmentStates
    .filter(({ remaining }) => remaining.toCents() === 0)
    .reverse();

  const paymentRows = (installment: InstallmentDetail, remaining: Money) =>
    installment.payments.map((payment) => (
      <li
        key={payment.id}
        className="flex flex-col gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60"
      >
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
            {dateFormatter.format(payment.paidAt)}
            {payment.paymentMethod ? ` · ${paymentMethodLabels[payment.paymentMethod]}` : ""}
            {payment.receivedByLabel ? ` · recebido por ${payment.receivedByLabel}` : ""}
          </span>
          <span className="text-[15px] font-semibold whitespace-nowrap">
            {formatCurrency(payment.amount)}
          </span>
        </span>
        {payment.registeredByLabel && payment.registeredByLabel !== payment.receivedByLabel ? (
          <span className="text-[15px] text-amber-800 dark:text-amber-300">
            Registrado por {payment.registeredByLabel}
          </span>
        ) : null}
        {canReceiveFunds ? (
          <span className="self-start">
            <CorrectPaymentButton
              installmentId={installment.id}
              paymentId={payment.id}
              donorName={pledge.donorName}
              amountCents={payment.amount.toCents()}
              maxAmountCents={remaining.toCents() + payment.amount.toCents()}
              installmentAmountLabel={formatCurrency(installment.amount)}
              monthLabel={formatMonthLabel(installment.dueDate)}
              currentPaidAtIso={payment.paidAt.toISOString().slice(0, 10)}
              currentPaymentMethod={payment.paymentMethod ?? "pix"}
              currentReceivedByUserId={payment.receivedByUserId ?? session.user.id}
              users={users}
              todayIso={todayIso}
              correctAction={correctPayment}
              revertAction={revertPayment}
            />
          </span>
        ) : null}
      </li>
    ));

  const pendingList =
    pendingInstallments.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhuma parcela a pagar — carnê quitado.
      </p>
    ) : (
      <ul className="flex flex-col gap-3">
        {pendingInstallments.map(({ installment, paid, remaining }) => {
          const partial = paid.toCents() > 0;
          return (
            <li
              key={installment.id}
              className={`flex flex-col gap-3 rounded-2xl bg-white px-4 py-3.5 dark:bg-zinc-900 ${
                partial
                  ? "border-2 border-amber-300 dark:border-amber-700"
                  : "border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-semibold">
                    {formatMonthLabel(installment.dueDate)}
                  </span>
                  <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                    {partial
                      ? `Pago ${formatCurrency(paid)} de ${formatCurrency(installment.amount)}`
                      : formatCurrency(installment.amount)}
                  </span>
                </span>
                {partial ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold whitespace-nowrap text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Falta {formatCurrency(remaining)}
                  </span>
                ) : !canReceiveFunds ? (
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-amber-800 dark:text-amber-300">
                    <ClockIcon className="h-5 w-5 shrink-0" />
                    Pendente
                  </span>
                ) : null}
                {!partial && canReceiveFunds ? (
                  <PayInstallmentButton
                    installmentId={installment.id}
                    donorName={pledge.donorName}
                    monthLabel={formatMonthLabel(installment.dueDate)}
                    installmentAmountLabel={formatCurrency(installment.amount)}
                    remainingCents={remaining.toCents()}
                    buttonLabel="Dar baixa"
                    todayIso={todayIso}
                    users={users}
                    currentUserId={session.user.id}
                    action={markInstallmentAsPaid}
                  />
                ) : null}
              </div>
              {partial ? (
                <>
                  <ProgressBar
                    percentage={Math.round((paid.toCents() / installment.amount.toCents()) * 100)}
                  />
                  <ul className="flex flex-col gap-2">{paymentRows(installment, remaining)}</ul>
                  {canReceiveFunds ? (
                    <span className="self-start">
                      <PayInstallmentButton
                        installmentId={installment.id}
                        donorName={pledge.donorName}
                        monthLabel={formatMonthLabel(installment.dueDate)}
                        installmentAmountLabel={formatCurrency(installment.amount)}
                        remainingCents={remaining.toCents()}
                        buttonLabel="Registrar o restante"
                        todayIso={todayIso}
                        users={users}
                        currentUserId={session.user.id}
                        action={markInstallmentAsPaid}
                      />
                    </span>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    );

  const paidList =
    paidInstallments.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhuma parcela paga ainda.
      </p>
    ) : (
      <ul className="flex flex-col gap-3">
        {paidInstallments.map(({ installment, paid, remaining }) => (
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
            {installment.payments.length > 1 ? (
              <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                Pago em {installment.payments.length} vezes · {formatCurrency(paid)}
              </span>
            ) : null}
            <ul className="flex flex-col gap-2">{paymentRows(installment, remaining)}</ul>
          </li>
        ))}
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
