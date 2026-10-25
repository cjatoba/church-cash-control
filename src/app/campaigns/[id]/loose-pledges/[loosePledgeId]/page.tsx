import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLoosePledgeDetail } from "@/server/application/get-loose-pledge-detail";
import { addLoosePledgeContribution } from "@/server/application/add-loose-pledge-contribution";
import { closeLoosePledge, reopenLoosePledge } from "@/server/application/close-loose-pledge";
import { listUsers } from "@/server/application/list-users";
import { createLoosePledgeRepository } from "@/server/infrastructure/db/loose-pledge-repository";
import { createLoosePledgeContributionRepository } from "@/server/infrastructure/db/loose-pledge-contribution-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { PageShell } from "@/app/_components/page-shell";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { PageHeader } from "@/app/_components/page-header";
import { Card, SectionTitle } from "@/app/_components/card";
import { formatCurrency } from "@/app/_lib/format";
import { Money } from "@/server/domain/money";
import { SubmitButton } from "@/app/_components/submit-button";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { ArchiveBoxIcon, ArrowPathIcon, PencilIcon } from "@/app/_components/icons";
import {
  AddContributionButton,
  type AddContributionState,
} from "./_components/add-contribution-button";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
};

export default async function LoosePledgeDetailPage({
  params,
}: PageProps<"/campaigns/[id]/loose-pledges/[loosePledgeId]">) {
  const { id: campaignId, loosePledgeId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const db = createDbClient();
  const loosePledgeRepository = createLoosePledgeRepository(db);
  const userListRepository = createUserListRepository(db);
  const [loosePledge, users] = await Promise.all([
    getLoosePledgeDetail(loosePledgeRepository, loosePledgeId),
    listUsers(userListRepository),
  ]);

  if (!loosePledge) {
    notFound();
  }
  const donorName = loosePledge.donorName;
  const donorId = loosePledge.donorId;

  async function addContribution(
    _prevState: AddContributionState,
    formData: FormData,
  ): Promise<AddContributionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const input = {
      amount: formData.get("amount"),
      date: formData.get("date"),
      paymentMethod: formData.get("paymentMethod"),
      receivedByUserId: formData.get("receivedByUserId"),
    };

    try {
      const db = createDbClient();
      const loosePledgeRepository = createLoosePledgeRepository(db);
      const contributionRepository = createLoosePledgeContributionRepository(db);
      await addLoosePledgeContribution(
        { statusReader: loosePledgeRepository, repository: contributionRepository },
        loosePledgeId,
        input,
        actionSession.user.id,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "loose_contribution_created",
        subjectName: donorName,
        donorId,
        amountCents: Math.round(Number(input.amount) * 100),
      });
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível registrar a contribuição. Confira os dados informados.",
        ),
        values: {
          amount: typeof input.amount === "string" ? input.amount : "",
          date: typeof input.date === "string" ? input.date : "",
          paymentMethod: typeof input.paymentMethod === "string" ? input.paymentMethod : "",
          receivedByUserId:
            typeof input.receivedByUserId === "string" ? input.receivedByUserId : "",
        },
      };
    }

    redirect(`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`);
  }

  async function close(): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    const loosePledgeRepository = createLoosePledgeRepository(db);
    await closeLoosePledge(loosePledgeRepository, loosePledgeId);
    await logActivity(db, {
      actorUserId: actionSession.user.id,
      action: "loose_pledge_closed",
      subjectName: donorName,
      donorId,
    });

    redirect(`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`);
  }

  async function reopen(): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    const loosePledgeRepository = createLoosePledgeRepository(db);
    await reopenLoosePledge(loosePledgeRepository, loosePledgeId);
    await logActivity(db, {
      actorUserId: actionSession.user.id,
      action: "loose_pledge_reopened",
      subjectName: donorName,
      donorId,
    });

    redirect(`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`);
  }

  const totalCents = loosePledge.contributions.reduce(
    (sum, contribution) => sum + contribution.amount.toCents(),
    0,
  );
  const closed = loosePledge.status === "closed";
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}/donors`}
        title={loosePledge.donorName}
        subtitle={`Carnê ${loosePledge.pledgeTypeName} · valor livre`}
      />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Já entregou</span>
          <span
            className={
              closed
                ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300"
                : "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }
          >
            {closed ? "Fechado" : "Em aberto"}
          </span>
        </div>
        <span className="text-3xl font-bold">{formatCurrency(Money.fromCents(totalCents))}</span>
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
          {loosePledge.contributions.length === 1
            ? "1 entrega"
            : `${String(loosePledge.contributions.length)} entregas`}
        </span>
      </Card>

      {session.user.canReceiveFunds && !closed ? (
        <AddContributionButton
          users={users}
          currentUserId={session.user.id}
          todayIso={todayIso}
          action={addContribution}
        />
      ) : null}

      <section className="flex flex-col gap-2">
        <SectionTitle>Entregas</SectionTitle>
        {loosePledge.contributions.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Nenhuma entrega registrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {loosePledge.contributions.map((contribution) => (
              <li key={contribution.id} className="flex flex-col gap-1 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[17px]">{dateFormatter.format(contribution.date)}</span>
                  <span className="text-[17px] font-semibold">
                    {formatCurrency(contribution.amount)}
                  </span>
                </div>
                <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                  {paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod} ·
                  recebido por {contribution.receivedByLabel}
                </span>
                {contribution.registeredByLabel !== contribution.receivedByLabel ? (
                  <span className="text-[15px] text-amber-800 dark:text-amber-300">
                    Registrado por {contribution.registeredByLabel}
                  </span>
                ) : null}
                {session.user.canReceiveFunds ? (
                  <Link
                    href={`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}/contributions/${contribution.id}`}
                    className={`${buttonBaseClassName} ${buttonClassNames.outline} mt-1 self-start`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Corrigir
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {session.user.canReceiveFunds ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>Situação do carnê</SectionTitle>
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
              {closed
                ? "Este carnê foi encerrado. Reabra se o doador voltar a entregar valores."
                : "Encerre quando o doador não for entregar mais nada neste carnê."}
            </p>
            {closed ? (
              <form action={reopen}>
                <SubmitButton pendingLabel="Reabrindo…" variant="outline">
                  <ArrowPathIcon className="h-5 w-5" />
                  Reabrir carnê
                </SubmitButton>
              </form>
            ) : (
              <form action={close}>
                <SubmitButton pendingLabel="Encerrando…" variant="outline">
                  <ArchiveBoxIcon className="h-5 w-5" />
                  Encerrar carnê
                </SubmitButton>
              </form>
            )}
          </div>
        </section>
      ) : null}
      {session.user.canReceiveFunds ? (
        <NavSection title="Ajustes do carnê">
          <NavListItem
            href={`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}/change-type`}
            title="Corrigir tipo de carnê"
            description="Use se escolheu o tipo errado no cadastro"
            icon={<PencilIcon className="h-6 w-6" />}
          />
        </NavSection>
      ) : null}
    </PageShell>
  );
}
