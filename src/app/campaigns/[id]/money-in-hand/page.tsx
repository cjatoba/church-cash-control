import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCampaign } from "@/server/application/get-campaign";
import { getMoneyInHand } from "@/server/application/get-money-in-hand";
import { listCustodyTransfers } from "@/server/application/list-custody-transfers";
import { createCustodyTransfer } from "@/server/application/create-custody-transfer";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { TransferButton } from "./_components/transfer-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

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

  async function transfer(formData: FormData): Promise<void> {
    "use server";

    const registeredByUserId = (await auth())?.user.id;
    if (!registeredByUserId) {
      throw new Error("Não autenticado");
    }

    const input = {
      campaignId,
      fromUserId: formData.get("fromUserId"),
      recipientName: formData.get("recipientName"),
      amount: formData.get("amount"),
      transferDate: formData.get("transferDate"),
      description: formData.get("description"),
    };

    const db = createDbClient();
    const custodyRepository = createCustodyRepository(db);
    await createCustodyTransfer(
      { balanceReader: custodyRepository, repository: custodyRepository },
      input,
      registeredByUserId,
    );

    redirect(`/campaigns/${campaignId}/money-in-hand`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Dinheiro em mãos</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{campaign.name}</p>
        </div>

        <ul className="flex flex-col gap-2">
          {balances.map((balance) => (
            <li
              key={balance.userId}
              className="flex items-center justify-between rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
            >
              <span>
                {balance.userId === session.user.id
                  ? `${balance.userLabel} (você)`
                  : balance.userLabel}
              </span>
              <span className="font-medium">
                {currencyFormatter.format(balance.balance.toCents() / 100)}
              </span>
            </li>
          ))}
        </ul>

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

        <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Histórico de repasses
          </h2>
          {transfers.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum repasse registrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {transfers.map((transfer) => (
                <li
                  key={transfer.id}
                  className="flex flex-col gap-1 rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {dateFormatter.format(transfer.transferDate)} · {transfer.fromUserLabel} →{" "}
                      {transfer.recipientName}
                    </span>
                    <span className="font-medium">
                      {currencyFormatter.format(transfer.amount.toCents() / 100)}
                    </span>
                  </div>
                  {transfer.registeredByUserLabel !== transfer.fromUserLabel ? (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      ⚠ Registrado por {transfer.registeredByUserLabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
