import { and, eq, gte, lt } from "drizzle-orm";
import type { OneOffDonationRepository } from "@/server/application/create-one-off-donation";
import type { OneOffDonationStore } from "@/server/application/correct-received-entry";
import type { OneOffDonationsForMonthReader } from "@/server/application/get-monthly-progress";
import { Money } from "@/server/domain/money";
import type { PaymentMethod } from "@/server/domain/payment-method";
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

function toPaymentMethod(value: string | null): PaymentMethod | null {
  return value === "pix" || value === "cash" ? value : null;
}

export function createOneOffDonationStore(db: DbClient): OneOffDonationStore {
  return {
    async findById(id) {
      const [row] = await db
        .select()
        .from(oneOffDonations)
        .where(eq(oneOffDonations.id, id))
        .limit(1);
      if (!row) {
        return null;
      }
      return {
        campaignId: row.campaignId,
        subjectName: row.donorName ?? "Doação anônima",
        donorId: null,
        fields: {
          donorName: row.donorName,
          amount: Money.fromCents(row.amountCents),
          date: row.date,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          receivedByUserId: row.receivedByUserId,
        },
      };
    },

    async update(id, fields) {
      await db
        .update(oneOffDonations)
        .set({
          donorName: fields.donorName,
          amountCents: fields.amount.toCents(),
          date: fields.date,
          paymentMethod: fields.paymentMethod,
          receivedByUserId: fields.receivedByUserId,
        })
        .where(eq(oneOffDonations.id, id));
    },

    async remove(id) {
      await db.delete(oneOffDonations).where(eq(oneOffDonations.id, id));
    },
  };
}
