import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createOneOffDonation } from "@/server/application/create-one-off-donation";
import { listUsers } from "@/server/application/list-users";
import { createOneOffDonationRepository } from "@/server/infrastructure/db/one-off-donation-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { OneOffDonationForm, type CreateOneOffDonationState } from "./one-off-donation-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export default async function NewOneOffDonationPage({
  params,
}: PageProps<"/campaigns/[id]/one-off-donations/new">) {
  const { id: campaignId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.canReceiveFunds) {
    redirect("/");
  }

  const db = createDbClient();
  const userListRepository = createUserListRepository(db);
  const users = await listUsers(userListRepository);

  async function create(
    _prevState: CreateOneOffDonationState,
    formData: FormData,
  ): Promise<CreateOneOffDonationState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canReceiveFunds) {
      redirect("/");
    }
    const registeredByUserId = actionSession.user.id;

    const input = {
      campaignId,
      donorName: formData.get("donorName"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      paymentMethod: formData.get("paymentMethod"),
      receivedByUserId: formData.get("receivedByUserId"),
    };

    try {
      const db = createDbClient();
      const repository = createOneOffDonationRepository(db);
      const { id } = await createOneOffDonation(repository, input, registeredByUserId);
      return { success: id };
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível registrar a doação. Confira os dados informados.",
        ),
        values: {
          donorName: toStringValue(input.donorName),
          amount: toStringValue(input.amount),
          date: toStringValue(input.date),
          paymentMethod: toStringValue(input.paymentMethod),
          receivedByUserId: toStringValue(input.receivedByUserId),
        },
      };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <OneOffDonationForm users={users} currentUserId={session.user.id} action={create} />
    </div>
  );
}
