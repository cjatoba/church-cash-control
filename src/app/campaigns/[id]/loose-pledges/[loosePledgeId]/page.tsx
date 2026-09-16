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
import { BackLink } from "@/app/_components/back-link";
import { SubmitButton } from "@/app/_components/submit-button";
import { ArchiveBoxIcon, ArrowPathIcon } from "@/app/_components/icons";
import {
  AddContributionButton,
  type AddContributionState,
} from "./_components/add-contribution-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
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

    redirect(`/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`);
  }

  const totalCents = loosePledge.contributions.reduce(
    (sum, contribution) => sum + contribution.amount.toCents(),
    0,
  );
  const closed = loosePledge.status === "closed";
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <BackLink href={`/campaigns/${campaignId}/donors`} />
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
              {loosePledge.donorName}
            </h1>
            <span
              className={
                closed
                  ? "shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              }
            >
              {closed ? "Fechado" : "Em aberto"}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Carnê {loosePledge.pledgeTypeName} (avulso) · arrecadado{" "}
            <span className="font-semibold text-black dark:text-zinc-50">
              {currencyFormatter.format(totalCents / 100)}
            </span>
          </p>
        </div>

        <ul className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
          {loosePledge.contributions.length === 0 ? (
            <li className="text-sm text-zinc-600 dark:text-zinc-400">
              Nenhuma contribuição registrada ainda.
            </li>
          ) : (
            loosePledge.contributions.map((contribution) => (
              <li
                key={contribution.id}
                className="flex flex-col gap-1 rounded border border-black/[.08] px-3 py-3 text-sm dark:border-white/[.16]"
              >
                <div className="flex items-center justify-between">
                  <span>{dateFormatter.format(contribution.date)}</span>
                  <span className="text-base font-semibold text-black dark:text-zinc-50">
                    {currencyFormatter.format(contribution.amount.toCents() / 100)}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod} ·
                  Recebido por {contribution.receivedByLabel}
                </span>
                {contribution.registeredByLabel !== contribution.receivedByLabel ? (
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠ Registrado por {contribution.registeredByLabel}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>

        {session.user.canReceiveFunds ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
            {!closed ? (
              <>
                <AddContributionButton
                  users={users}
                  currentUserId={session.user.id}
                  todayIso={todayIso}
                  action={addContribution}
                />
                <form action={close}>
                  <SubmitButton pendingLabel="Encerrando…" variant="outline">
                    <ArchiveBoxIcon className="h-4 w-4" />
                    Encerrar
                  </SubmitButton>
                </form>
              </>
            ) : (
              <form action={reopen}>
                <SubmitButton pendingLabel="Reabrindo…" variant="outline">
                  <ArrowPathIcon className="h-4 w-4" />
                  Reabrir
                </SubmitButton>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
