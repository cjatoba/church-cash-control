import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCampaign } from "@/server/application/get-campaign";
import { getMoneyInHand } from "@/server/application/get-money-in-hand";
import { listCustodyTransfers } from "@/server/application/list-custody-transfers";
import { createCustodyTransfer } from "@/server/application/create-custody-transfer";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { formatCurrency } from "@/app/_lib/format";
import { Money } from "@/server/domain/money";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Card } from "@/app/_components/card";
import { Tabs } from "@/app/_components/tabs";
import { TransferButton, type TransferState } from "./_components/transfer-button";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function MoneyInHandPage({
  params,
}: PageProps<"/campaigns/[id]/money-in-hand">) {
  const { id: campaignId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const db = createDbClient();
  const campaignRepository = createCampaignRepository(db);
  const custodyRepository = createCustodyRepository(db);

  const [campaign, balances, transfers] = await Promise.all([
    getCampaign(campaignRepository, campaignId),
    getMoneyInHand(custodyRepository, campaignId),
    listCustodyTransfers(custodyRepository, campaignId),
  ]);

  if (!campaign) {
    notFound();
  }

  async function transfer(_prevState: TransferState, formData: FormData): Promise<TransferState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }
    const registeredByUserId = actionSession.user.id;

    const input = {
      campaignId,
      fromUserId: formData.get("fromUserId"),
      recipientName: formData.get("recipientName"),
      amount: formData.get("amount"),
      transferDate: formData.get("transferDate"),
      description: formData.get("description"),
    };

    try {
      const db = createDbClient();
      const custodyRepository = createCustodyRepository(db);
      await createCustodyTransfer(
        { balanceReader: custodyRepository, repository: custodyRepository },
        input,
        registeredByUserId,
      );
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível registrar o repasse. Confira os dados informados.",
        ),
        values: {
          fromUserId: toStringValue(input.fromUserId),
          amount: toStringValue(input.amount),
          recipientName: toStringValue(input.recipientName),
          transferDate: toStringValue(input.transferDate),
          description: toStringValue(input.description),
        },
      };
    }

    redirect(`/campaigns/${campaignId}/money-in-hand`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const totalInHands = balances.reduce(
    (sum, balance) => sum.add(balance.balance),
    Money.fromCents(0),
  );

  const balancesList =
    balances.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Ninguém recebeu dinheiro nesta campanha ainda.
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {balances.map((balance) => {
          const isCurrentUser = balance.userId === session.user.id;
          return (
            <li
              key={balance.userId}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
            >
              <span className={isCurrentUser ? "text-[17px] font-semibold" : "text-[17px]"}>
                {isCurrentUser ? `${balance.userLabel} (você)` : balance.userLabel}
              </span>
              <span className="text-[17px] font-semibold">{formatCurrency(balance.balance)}</span>
            </li>
          );
        })}
      </ul>
    );

  const transfersList =
    transfers.length === 0 ? (
      <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Nenhum repasse registrado.
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {transfers.map((transfer) => (
          <li key={transfer.id} className="flex flex-col gap-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[17px]">
                {transfer.fromUserLabel} → {transfer.recipientName}
              </span>
              <span className="text-[17px] font-semibold">{formatCurrency(transfer.amount)}</span>
            </div>
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
              {dateFormatter.format(transfer.transferDate)}
            </span>
            {transfer.registeredByUserLabel !== transfer.fromUserLabel ? (
              <span className="text-[15px] text-amber-800 dark:text-amber-300">
                Registrado por {transfer.registeredByUserLabel}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    );

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}`}
        title="Dinheiro em mãos"
        subtitle={campaign.name}
      />

      <Card>
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">Total com as pessoas</span>
        <span className="text-3xl font-bold">{formatCurrency(totalInHands)}</span>
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
          Recebido e ainda não repassado
        </span>
      </Card>

      {session.user.canReceiveFunds ? (
        <TransferButton
          balances={balances.map((balance) => ({
            userId: balance.userId,
            userLabel: balance.userLabel,
            balanceCents: balance.balance.toCents(),
          }))}
          currentUserId={session.user.id}
          todayIso={todayIso}
          action={transfer}
        />
      ) : null}

      <Tabs
        label="Dinheiro em mãos"
        initialTabId="balances"
        tabs={[
          { id: "balances", label: "Com quem está", content: balancesList },
          {
            id: "transfers",
            label: `Repasses (${String(transfers.length)})`,
            content: transfersList,
          },
        ]}
      />
    </PageShell>
  );
}
