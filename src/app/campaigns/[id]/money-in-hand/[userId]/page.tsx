import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCampaign } from "@/server/application/get-campaign";
import { listPersonCustodyActivity } from "@/server/application/list-person-custody-activity";
import type {
  PersonReceivedEntry,
  ReceivedEntryKind,
} from "@/server/application/list-person-custody-activity";
import { listUsers } from "@/server/application/list-users";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createPersonCustodyActivityReader } from "@/server/infrastructure/db/custody-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { formatDate, paymentMethodLabels } from "@/app/_lib/entry-change-details";
import { formatCurrency, formatMonthLabel } from "@/app/_lib/format";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { EyeIcon, PencilIcon } from "@/app/_components/icons";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { Tabs } from "@/app/_components/tabs";
import { Money } from "@/server/domain/money";
import { VolunteerTransferBadge } from "../../_components/volunteer-transfer-badge";

const kindLabels: Record<ReceivedEntryKind, { label: string; className: string }> = {
  installment: {
    label: "Parcela de carnê",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  one_off_donation: {
    label: "Doação sem carnê",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  loose_contribution: {
    label: "Entrega de carnê avulso",
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
  volunteer_transfer: {
    label: "Repasse de voluntário",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
};

const emptyClassName =
  "rounded-2xl border border-zinc-200 bg-white p-6 text-center text-[15px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";

const listClassName =
  "flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900";

function entryLink(
  campaignId: string,
  entry: PersonReceivedEntry,
  canCorrect: boolean,
): { href: string; label: string; correct: boolean } | null {
  if (entry.kind === "volunteer_transfer") {
    return canCorrect
      ? { href: `/campaigns/${campaignId}/transfers/${entry.id}`, label: "Corrigir", correct: true }
      : null;
  }
  if (entry.kind === "installment") {
    return entry.sourceId
      ? {
          href: `/campaigns/${campaignId}/pledges/${entry.sourceId}`,
          label: "Ver no carnê",
          correct: false,
        }
      : null;
  }
  if (!canCorrect) {
    return entry.kind === "loose_contribution" && entry.sourceId
      ? {
          href: `/campaigns/${campaignId}/loose-pledges/${entry.sourceId}`,
          label: "Ver no carnê",
          correct: false,
        }
      : null;
  }
  return entry.kind === "one_off_donation"
    ? {
        href: `/campaigns/${campaignId}/one-off-donations/${entry.id}`,
        label: "Corrigir",
        correct: true,
      }
    : {
        href: `/campaigns/${campaignId}/loose-pledges/${entry.sourceId ?? ""}/contributions/${entry.id}`,
        label: "Corrigir",
        correct: true,
      };
}

function describeEntry(entry: PersonReceivedEntry): string {
  const parts = [formatDate(entry.date)];
  if (entry.paymentMethod) {
    parts.push(paymentMethodLabels[entry.paymentMethod]);
  }
  if (entry.dueDate) {
    parts.push(`Parcela de ${formatMonthLabel(entry.dueDate)}`);
  }
  if (entry.registeredByLabel) {
    parts.push(`Registrado por ${entry.registeredByLabel}`);
  }
  return parts.join(" · ");
}

export default async function PersonMoneyInHandPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/money-in-hand/[userId]">) {
  const { id: campaignId, userId } = await params;
  const initialTabId = (await searchParams).tab === "transfers" ? "transfers" : "received";
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const db = createDbClient();
  const [campaign, users, activity] = await Promise.all([
    getCampaign(createCampaignRepository(db), campaignId),
    listUsers(createUserListRepository(db)),
    listPersonCustodyActivity(createPersonCustodyActivityReader(db), campaignId, userId),
  ]);
  const person = users.find((user) => user.id === userId);
  if (!campaign || !person) {
    notFound();
  }
  const canCorrect = session.user.canReceiveFunds;
  const fromVolunteers = activity.received
    .filter((entry) => entry.kind === "volunteer_transfer")
    .reduce((sum, entry) => sum.add(entry.amount), Money.fromCents(0));

  const receivedList =
    activity.received.length === 0 ? (
      <p className={emptyClassName}>{person.name} não recebeu nada nesta campanha.</p>
    ) : (
      <ul className={listClassName}>
        {activity.received.map((entry) => {
          const kind = kindLabels[entry.kind];
          const link = entryLink(campaignId, entry, canCorrect);
          return (
            <li key={`${entry.kind}-${entry.id}`} className="flex flex-col gap-1 px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex flex-col gap-1">
                  <span
                    className={`self-start rounded-md px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${kind.className}`}
                  >
                    {kind.label}
                  </span>
                  <span className="text-[17px] font-semibold">
                    {entry.donorLabel ?? "Doação anônima"}
                  </span>
                </span>
                <span className="text-[17px] font-bold whitespace-nowrap">
                  {formatCurrency(entry.amount)}
                </span>
              </div>
              <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                {describeEntry(entry)}
              </span>
              {link ? (
                <Link
                  href={link.href}
                  className={`${buttonBaseClassName} ${buttonClassNames.outline} mt-1 self-start`}
                >
                  {link.correct ? (
                    <PencilIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  {link.label}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    );

  const transfersList =
    activity.transfers.length === 0 ? (
      <p className={emptyClassName}>{person.name} ainda não repassou nada nesta campanha.</p>
    ) : (
      <ul className={listClassName}>
        {activity.transfers.map((transfer) => (
          <li key={transfer.id} className="flex flex-col gap-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-1">
                <span className="text-[17px] font-semibold">Para {transfer.recipientName}</span>
                {transfer.toVolunteer ? <VolunteerTransferBadge label="Para voluntário" /> : null}
              </span>
              <span className="text-[17px] font-bold whitespace-nowrap">
                {formatCurrency(transfer.amount)}
              </span>
            </div>
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
              {formatDate(transfer.transferDate)} · Registrado por {transfer.registeredByLabel}
            </span>
            {canCorrect ? (
              <Link
                href={`/campaigns/${campaignId}/transfers/${transfer.id}`}
                className={`${buttonBaseClassName} ${buttonClassNames.outline} mt-1 self-start`}
              >
                <PencilIcon className="h-4 w-4" />
                Corrigir
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    );

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}/money-in-hand`}
        title={person.name}
        subtitle={`Dinheiro em mãos · ${campaign.name}`}
      />

      <section className="grid grid-cols-3 rounded-2xl border border-zinc-200 bg-white px-2 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Recebeu</span>
          <span className="text-lg font-bold">{formatCurrency(activity.receivedTotal)}</span>
        </span>
        <span className="flex flex-col items-center gap-0.5 border-x border-zinc-200 text-center dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Repassou</span>
          <span className="text-lg font-bold">{formatCurrency(activity.transferredTotal)}</span>
        </span>
        <span className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Em mãos</span>
          <span className="text-lg font-bold text-green-700 dark:text-green-400">
            {formatCurrency(activity.balance)}
          </span>
        </span>
      </section>

      {fromVolunteers.toCents() > 0 ? (
        <p className="px-1 text-[15px] text-zinc-600 dark:text-zinc-400">
          Inclui {formatCurrency(fromVolunteers)} recebidos de outros voluntários.
        </p>
      ) : null}

      <Tabs
        label="Entradas e repasses"
        initialTabId={initialTabId}
        tabs={[
          {
            id: "received",
            label: `Recebeu (${String(activity.received.length)})`,
            content: receivedList,
          },
          {
            id: "transfers",
            label: `Repassou (${String(activity.transfers.length)})`,
            content: transfersList,
          },
        ]}
      />
    </PageShell>
  );
}
