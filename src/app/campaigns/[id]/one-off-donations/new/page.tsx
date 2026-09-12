import { createOneOffDonation } from "@/server/application/create-one-off-donation";
import { createOneOffDonationRepository } from "@/server/infrastructure/db/one-off-donation-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { OneOffDonationForm, type CreateOneOffDonationState } from "./one-off-donation-form";

export default async function NewOneOffDonationPage({
  params,
}: PageProps<"/campaigns/[id]/one-off-donations/new">) {
  const { id: campaignId } = await params;

  async function create(
    _prevState: CreateOneOffDonationState,
    formData: FormData,
  ): Promise<CreateOneOffDonationState> {
    "use server";

    const input = {
      campaignId,
      donorName: formData.get("donorName"),
      amount: formData.get("amount"),
      date: formData.get("date"),
    };

    try {
      const db = createDbClient();
      const repository = createOneOffDonationRepository(db);
      const { id } = await createOneOffDonation(repository, input);
      return { success: id };
    } catch {
      return { error: "Não foi possível registrar a doação. Confira os dados informados." };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <OneOffDonationForm action={create} />
    </div>
  );
}
