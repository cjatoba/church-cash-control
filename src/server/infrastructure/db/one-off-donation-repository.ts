import type { OneOffDonationRepository } from "@/server/application/create-one-off-donation";
import type { DbClient } from "./client";
import { oneOffDonations } from "./schema";

export function createOneOffDonationRepository(db: DbClient): OneOffDonationRepository {
  return {
    async create(donation) {
      const [row] = await db
        .insert(oneOffDonations)
        .values({
          campaignId: donation.campaignId,
          donorName: donation.donorName,
          amountCents: donation.amount.toCents(),
          date: donation.date,
        })
        .returning({ id: oneOffDonations.id });

      if (!row) {
        throw new Error("Falha ao registrar doação avulsa");
      }
      return row;
    },
  };
}
