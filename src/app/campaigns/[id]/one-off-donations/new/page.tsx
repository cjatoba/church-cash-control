import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createOneOffDonation } from "@/server/application/create-one-off-donation";
import { listUsers } from "@/server/application/list-users";
import { createOneOffDonationRepository } from "@/server/infrastructure/db/one-off-donation-repository";
import { createUserListRepository } from "@/server/infrastructure/db/user-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { OneOffDonationForm, type CreateOneOffDonationState } from "./one-off-donation-form";

export default async function NewOneOffDonationPage({
  params,
}: PageProps<"/campaigns/[id]/one-off-donations/new">) {
  const { id: campaignId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const db = createDbClient();
  const userListRepository = createUserListRepository(db);
  const users = await listUsers(userListRepository);

  async function create(
    _prevState: CreateOneOffDonationState,
    formData: FormData,
  ): Promise<CreateOneOffDonationState> {
    "use server";

    const registeredByUserId = (await auth())?.user.id;
    if (!registeredByUserId) {
      throw new Error("Não autenticado");
    }

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
    } catch {
      return { error: "Não foi possível registrar a doação. Confira os dados informados." };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <OneOffDonationForm users={users} currentUserId={session.user.id} action={create} />
    </div>
  );
}
