import { and, eq, inArray } from "drizzle-orm";
import type {
  InstallmentReader,
  InstallmentRepository,
} from "@/server/application/pay-installment";
import type { InstallmentsForMonthReader } from "@/server/application/get-monthly-progress";
import type {
  CampaignInstallmentsReader,
  InstallmentsRemover,
} from "@/server/application/update-campaign";
import type { InstallmentUnpayRepository } from "@/server/application/revert-installment-payment";
import { Money } from "@/server/domain/money";
import type { PaymentMethod } from "@/server/domain/payment-method";
import type { DbClient } from "./client";
import { donors, installments, pledges } from "./schema";

function toPaymentMethod(value: string | null): PaymentMethod | null {
  return value === "pix" || value === "cash" ? value : null;
}

export function createInstallmentRepository(
  db: DbClient,
): InstallmentReader &
  InstallmentRepository &
  InstallmentsForMonthReader &
  CampaignInstallmentsReader &
  InstallmentsRemover &
  InstallmentUnpayRepository {
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
        paymentMethod: toPaymentMethod(row.paymentMethod),
        receivedByUserId: row.receivedByUserId,
        registeredByUserId: row.registeredByUserId,
      };
    },

    async markAsPaid(installmentId, payment) {
      await db
        .update(installments)
        .set({
          paidAt: payment.paidAt,
          paidAmountCents: payment.paidAmount.toCents(),
          paymentMethod: payment.paymentMethod,
          receivedByUserId: payment.receivedByUserId,
          registeredByUserId: payment.registeredByUserId,
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

    async findInstallmentsByCampaign(campaignId) {
      const rows = await db
        .select({
          id: installments.id,
          dueDate: installments.dueDate,
          paidAt: installments.paidAt,
        })
        .from(installments)
        .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
        .where(eq(pledges.campaignId, campaignId));

      return rows;
    },

    async removeMany(installmentIds) {
      if (installmentIds.length === 0) {
        return;
      }
      await db.delete(installments).where(inArray(installments.id, installmentIds));
    },

    async markAsUnpaid(installmentId) {
      await db
        .update(installments)
        .set({
          paidAt: null,
          paidAmountCents: null,
          paymentMethod: null,
          receivedByUserId: null,
          registeredByUserId: null,
        })
        .where(eq(installments.id, installmentId));
    },
  };
}
