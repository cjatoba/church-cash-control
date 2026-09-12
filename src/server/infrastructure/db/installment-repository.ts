import { and, eq } from "drizzle-orm";
import type {
  InstallmentReader,
  InstallmentRepository,
} from "@/server/application/pay-installment";
import type { InstallmentsForMonthReader } from "@/server/application/get-monthly-progress";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { donors, installments, pledges } from "./schema";

export function createInstallmentRepository(
  db: DbClient,
): InstallmentReader & InstallmentRepository & InstallmentsForMonthReader {
  return {
    async findById(installmentId) {
      const [row] = await db
        .select()
        .from(installments)
        .where(eq(installments.id, installmentId))
        .limit(1);

      if (!row) {
        return null;
      }
      return {
        amount: Money.fromCents(row.amountCents),
        paidAt: row.paidAt,
      };
    },

    async markAsPaid(installmentId, payment) {
      await db
        .update(installments)
        .set({
          paidAt: payment.paidAt,
          paidAmountCents: payment.paidAmount.toCents(),
        })
        .where(eq(installments.id, installmentId));
    },

    async findDueInMonth(campaignId, month) {
      const rows = await db
        .select({
          donorName: donors.name,
          amountCents: installments.amountCents,
          paidAt: installments.paidAt,
          paidAmountCents: installments.paidAmountCents,
        })
        .from(installments)
        .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
        .innerJoin(donors, eq(pledges.donorId, donors.id))
        .where(and(eq(pledges.campaignId, campaignId), eq(installments.dueDate, month)));

      return rows.map((row) => ({
        donorName: row.donorName,
        amount: Money.fromCents(row.amountCents),
        paidAt: row.paidAt,
        paidAmount: row.paidAmountCents === null ? null : Money.fromCents(row.paidAmountCents),
      }));
    },
  };
}
