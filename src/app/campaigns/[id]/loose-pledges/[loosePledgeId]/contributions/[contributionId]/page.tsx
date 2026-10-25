import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  correctLooseContribution,
  deleteLooseContribution,
  findReceivedEntry,
} from "@/server/application/correct-received-entry";
import { listUsers } from "@/server/application/list-users";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createLooseContributionStore } from "@/server/infrastructure/db/loose-pledge-contribution-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { describeEntryCorrection, toNameMap } from "@/app/_lib/entry-change-details";
import { formatCurrency } from "@/app/_lib/format";
import { logActivity } from "@/app/_lib/log-activity";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { CorrectEntryForm } from "../../../../_components/correct-entry-form";
import { DeleteSection, type CorrectionState } from "../../../../_components/correction-form-parts";

export default async function CorrectLooseContributionPage({
  params,
}: PageProps<"/campaigns/[id]/loose-pledges/[loosePledgeId]/contributions/[contributionId]">) {
  const { id: campaignId, loosePledgeId, contributionId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.canReceiveFunds) {
    redirect("/");
  }

  const db = createDbClient();
  const [contribution, users] = await Promise.all([
    findReceivedEntry(createLooseContributionStore(db), campaignId, contributionId),
    listUsers(createUserListRepository(db)),
  ]);
  if (!contribution) {
    notFound();
  }
  const backHref = `/campaigns/${campaignId}/loose-pledges/${loosePledgeId}`;

  async function save(_prevState: CorrectionState, formData: FormData): Promise<CorrectionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    try {
      const result = await correctLooseContribution(
        { store: createLooseContributionStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        contributionId,
        {
          amount: formData.get("amount"),
          date: formData.get("date"),
          paymentMethod: formData.get("paymentMethod"),
          receivedByUserId: formData.get("receivedByUserId"),
        },
      );
      const names = toNameMap(await listUsers(createUserListRepository(db)));
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "loose_contribution_corrected",
        subjectName: result.subjectName,
        donorId: result.donorId,
        amountCents: result.after.amount.toCents(),
        details: describeEntryCorrection(result.before, result.after, names),
      });
    } catch (error) {
      return { error: toFriendlyErrorMessage(error, "Não foi possível salvar a correção.") };
    }
    redirect(backHref);
  }

  async function remove(): Promise<CorrectionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    try {
      const deleted = await deleteLooseContribution(
        { store: createLooseContributionStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        contributionId,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "loose_contribution_deleted",
        subjectName: deleted.subjectName,
        donorId: deleted.donorId,
        amountCents: deleted.fields.amount.toCents(),
      });
    } catch (error) {
      return { error: toFriendlyErrorMessage(error, "Não foi possível excluir a entrega.") };
    }
    redirect(backHref);
  }

  const amountLabel = formatCurrency(contribution.fields.amount);

  return (
    <PageShell>
      <PageHeader
        backHref={backHref}
        title="Corrigir entrega"
        subtitle={`${contribution.subjectName} · ${amountLabel}`}
      />
      <CorrectEntryForm
        users={users}
        todayIso={new Date().toISOString().slice(0, 10)}
        initialValues={{
          receivedByUserId: contribution.fields.receivedByUserId,
          amount: (contribution.fields.amount.toCents() / 100).toFixed(2),
          date: contribution.fields.date.toISOString().slice(0, 10),
          paymentMethod: contribution.fields.paymentMethod,
        }}
        action={save}
      />
      <DeleteSection
        question="Lançou por engano?"
        explanation="Excluir tira esta entrega do total arrecadado e do dinheiro em mãos de quem recebeu."
        buttonLabel="Excluir esta entrega"
        confirmLabel={`Excluir de vez esta entrega de ${amountLabel}?`}
        action={remove}
      />
    </PageShell>
  );
}
