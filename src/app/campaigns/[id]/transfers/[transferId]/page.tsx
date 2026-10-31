import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  correctCustodyTransfer,
  deleteCustodyTransfer,
  findCustodyTransfer,
} from "@/server/application/correct-custody-transfer";
import { listUsers } from "@/server/application/list-users";
import {
  createCustodyRepository,
  createCustodyTransferStore,
} from "@/server/infrastructure/db/custody-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toActionErrorState } from "@/app/_lib/action-error-message";
import { describeTransferCorrection, toNameMap } from "@/app/_lib/entry-change-details";
import { formatCurrency } from "@/app/_lib/format";
import { logActivity } from "@/app/_lib/log-activity";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { CorrectTransferForm } from "../../_components/correct-transfer-form";
import { DeleteSection, type CorrectionState } from "../../_components/correction-form-parts";
import { toTransferDestination } from "../../_lib/transfer-destination";

function personHref(campaignId: string, userId: string): string {
  return `/campaigns/${campaignId}/money-in-hand/${userId}`;
}

export default async function CorrectTransferPage({
  params,
}: PageProps<"/campaigns/[id]/transfers/[transferId]">) {
  const { id: campaignId, transferId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.canReceiveFunds) {
    redirect("/");
  }

  const db = createDbClient();
  const [transfer, users] = await Promise.all([
    findCustodyTransfer(createCustodyTransferStore(db), campaignId, transferId),
    listUsers(createUserListRepository(db)),
  ]);
  if (!transfer) {
    notFound();
  }

  async function save(_prevState: CorrectionState, formData: FormData): Promise<CorrectionState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }

    const db = createDbClient();
    let target: string;
    try {
      const result = await correctCustodyTransfer(
        { store: createCustodyTransferStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        transferId,
        {
          fromUserId: formData.get("fromUserId"),
          ...(toTransferDestination(formData.get("destination")) === "volunteer"
            ? { toUserId: formData.get("toUserId"), recipientName: "" }
            : { toUserId: "", recipientName: formData.get("recipientName") }),
          amount: formData.get("amount"),
          transferDate: formData.get("transferDate"),
          description: formData.get("description"),
        },
      );
      const names = toNameMap(await listUsers(createUserListRepository(db)));
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "custody_transfer_corrected",
        subjectName: result.subjectName,
        amountCents: result.after.amount.toCents(),
        details: describeTransferCorrection(result.before, result.after, names),
      });
      target = personHref(campaignId, result.after.fromUserId);
    } catch (error) {
      return toActionErrorState(error, "Não foi possível salvar a correção.", campaignId);
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
      const deleted = await deleteCustodyTransfer(
        { store: createCustodyTransferStore(db), balanceReader: createCustodyRepository(db) },
        campaignId,
        transferId,
      );
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "custody_transfer_deleted",
        subjectName: deleted.subjectName,
        amountCents: deleted.fields.amount.toCents(),
      });
      target = personHref(campaignId, deleted.fields.fromUserId);
    } catch (error) {
      return toActionErrorState(error, "Não foi possível excluir o repasse.", campaignId);
    }
    redirect(target);
  }

  const amountLabel = formatCurrency(transfer.fields.amount);

  return (
    <PageShell>
      <PageHeader
        backHref={personHref(campaignId, transfer.fields.fromUserId)}
        title="Corrigir repasse"
        subtitle={`${transfer.subjectName} · ${amountLabel}`}
      />
      <CorrectTransferForm
        users={users}
        todayIso={new Date().toISOString().slice(0, 10)}
        initialValues={{
          fromUserId: transfer.fields.fromUserId,
          destination: transfer.fields.toUserId ? "volunteer" : "external",
          toUserId: transfer.fields.toUserId ?? "",
          recipientName: transfer.fields.recipientName ?? "",
          amount: (transfer.fields.amount.toCents() / 100).toFixed(2),
          transferDate: transfer.fields.transferDate.toISOString().slice(0, 10),
          description: transfer.fields.description ?? "",
        }}
        action={save}
      />
      <DeleteSection
        question="Registrou por engano?"
        explanation={
          transfer.fields.toUserId
            ? "Excluir devolve o valor ao dinheiro em mãos de quem tinha repassado e tira de quem recebeu."
            : "Excluir devolve o valor ao dinheiro em mãos de quem tinha repassado."
        }
        buttonLabel="Excluir este repasse"
        confirmLabel={`Excluir de vez este repasse de ${amountLabel}?`}
        action={remove}
      />
    </PageShell>
  );
}
