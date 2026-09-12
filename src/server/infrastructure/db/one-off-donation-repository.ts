import { and, eq, gte, lt } from "drizzle-orm";
import type { OneOffDonationRepository } from "@/server/application/create-one-off-donation";
import type { OneOffDonationsForMonthReader } from "@/server/application/get-monthly-progress";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { oneOffDonations } from "./schema";

export function createOneOffDonationRepository(
  db: DbClient,
): OneOffDonationRepository & OneOffDonationsForMonthReader {
  return {
    async create(donation) {
      const [row] = await db
        .insert(oneOffDonations)
        .values({
          campaignId: donation.campaignId,
          donorName: donation.donorName,
          amountCents: donation.amount.toCents(),
          date: donation.date,
          paymentMethod: donation.paymentMethod,
          receivedByUserId: donation.receivedByUserId,
          registeredByUserId: donation.registeredByUserId,
        })
        .returning({ id: oneOffDonations.id });

      if (!row) {
        throw new Error("Falha ao registrar doação avulsa");
      }
      return row;
    },

    async findInMonth(campaignId, month) {
      const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));

      const rows = await db
        .select({ donorName: oneOffDonations.donorName, amountCents: oneOffDonations.amountCents })
        .from(oneOffDonations)
        .where(
          and(
            eq(oneOffDonations.campaignId, campaignId),
            gte(oneOffDonations.date, month),
            lt(oneOffDonations.date, nextMonth),
          ),
        );

      return rows.map((row) => ({
        donorName: row.donorName,
        amount: Money.fromCents(row.amountCents),
      }));
    },
  };
}
