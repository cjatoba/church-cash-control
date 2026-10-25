import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  correctOneOffDonation,
  deleteOneOffDonation,
  findReceivedEntry,
} from "@/server/application/correct-received-entry";
import { listUsers } from "@/server/application/list-users";
import { createCustodyRepository } from "@/server/infrastructure/db/custody-repository";
import { createOneOffDonationStore } from "@/server/infrastructure/db/one-off-donation-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { describeEntryCorrection, toNameMap } from "@/app/_lib/entry-change-details";
import { formatCurrency } from "@/app/_lib/format";
import { logActivity } from "@/app/_lib/log-activity";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { CorrectEntryForm } from "../../_components/correct-entry-form";
import { DeleteSection, type CorrectionState } from "../../_components/correction-form-parts";

function moneyInHandHref(campaignId: string, userId: string | null): string {
  return userId
    ? `/campaigns/${campaignId}/money-in-hand/${userId}`
    : `/campaigns/${campaignId}/money-in-hand`;
}

export default async function CorrectOneOffDonationPage({
  params,
}: PageProps<"/campaigns/[id]/one-off-donations/[donationId]">) {
  const { id: campaignId, donationId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.canReceiveFunds) {
    redirect("/");
  }

  const db = createDbClient();
  const [donation, users] = await Promise.all([
    findReceivedEntry(createOneOffDonationStore(db), campaignId, donationId),
    listUsers(createUserListRepository(db)),
  ]);
  if (!donation) {
    notFound();
  }
  const backHref = moneyInHandHref(campaignId, donation.fields.receivedByUserId);

  async function save(_prevState: CorrectionState, formData: FormData): Promise<CorrectionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    let target: string;
    try {
      const result = await correctOneOffDonation(
        { store: createOneOffDonationStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        donationId,
        {
          donorName: formData.get("donorName"),
          amount: formData.get("amount"),
          date: formData.get("date"),
          paymentMethod: formData.get("paymentMethod"),
          receivedByUserId: formData.get("receivedByUserId"),
        },
      );
      const names = toNameMap(await listUsers(createUserListRepository(db)));
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "one_off_donation_corrected",
        subjectName: result.subjectName,
        amountCents: result.after.amount.toCents(),
        details: describeEntryCorrection(result.before, result.after, names),
      });
      target = moneyInHandHref(campaignId, result.after.receivedByUserId);
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(error, "Não foi possível salvar a correção."),
      };
    }
    redirect(target);
  }

  async function remove(): Promise<CorrectionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    let target: string;
    try {
      const deleted = await deleteOneOffDonation(
        { store: createOneOffDonationStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        donationId,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "one_off_donation_deleted",
        subjectName: deleted.subjectName,
        amountCents: deleted.fields.amount.toCents(),
      });
      target = moneyInHandHref(campaignId, deleted.fields.receivedByUserId);
    } catch (error) {
      return { error: toFriendlyErrorMessage(error, "Não foi possível excluir a doação.") };
    }
    redirect(target);
  }

  const amountLabel = formatCurrency(donation.fields.amount);

  return (
    <PageShell>
      <PageHeader
        backHref={backHref}
        title="Corrigir doação sem carnê"
        subtitle={`${donation.subjectName} · ${amountLabel}`}
      />
      <CorrectEntryForm
        users={users}
        todayIso={new Date().toISOString().slice(0, 10)}
        initialValues={{
          receivedByUserId: donation.fields.receivedByUserId ?? "",
          amount: (donation.fields.amount.toCents() / 100).toFixed(2),
          date: donation.fields.date.toISOString().slice(0, 10),
          paymentMethod: donation.fields.paymentMethod ?? "pix",
          donorName: donation.fields.donorName ?? "",
        }}
        action={save}
      />
      <DeleteSection
        question="Lançou por engano?"
        explanation="Excluir tira esta doação do total arrecadado e do dinheiro em mãos de quem recebeu."
        buttonLabel="Excluir esta doação"
        confirmLabel={`Excluir de vez esta doação de ${amountLabel}?`}
        action={remove}
      />
    </PageShell>
  );
}
