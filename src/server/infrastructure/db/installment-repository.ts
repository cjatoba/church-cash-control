import { and, asc, eq, exists, inArray, sql } from "drizzle-orm";
import type {
  InstallmentPaymentWriter,
  InstallmentReader,
} from "@/server/application/pay-installment";
import type { InstallmentsForMonthReader } from "@/server/application/get-monthly-progress";
import type {
  CampaignInstallmentsReader,
  InstallmentsRemover,
} from "@/server/application/update-campaign";
import { Money } from "@/server/domain/money";
import type { PaymentMethod } from "@/server/domain/payment-method";
import type { DbClient } from "./client";
import { donors, installmentPayments, installments, pledges } from "./schema";

export function toPaymentMethod(value: string | null): PaymentMethod | null {
  return value === "pix" || value === "cash" ? value : null;
}

export const paidCentsOfInstallment = sql<number>`coalesce((
  select sum(${installmentPayments.amountCents}) from ${installmentPayments}
  where ${installmentPayments.installmentId} = ${installments.id}
), 0)::int`;

// paid_at da parcela guarda quando ela ficou paga por inteiro; recalculado na
// mesma transação de toda mudança nos pagamentos dela.
export function syncInstallmentPaidAt(db: DbClient, installmentId: string) {
  return db
    .update(installments)
    .set({
      paidAt: sql`(
        select case when coalesce(sum(p.amount_cents), 0) >= ${installments.amountCents}
          then max(p.paid_at) end
        from ${installmentPayments} p where p.installment_id = ${installments.id}
      )`,
    })
    .where(eq(installments.id, installmentId));
}

async function installmentIdOfPayment(db: DbClient, paymentId: string): Promise<string> {
  const [row] = await db
    .select({ installmentId: installmentPayments.installmentId })
    .from(installmentPayments)
    .where(eq(installmentPayments.id, paymentId))
    .limit(1);
  if (!row) {
    throw new Error("Pagamento não encontrado");
  }
  return row.installmentId;
}

export function createInstallmentRepository(
  db: DbClient,
): InstallmentReader &
  InstallmentPaymentWriter &
  InstallmentsForMonthReader &
  CampaignInstallmentsReader &
  InstallmentsRemover {
  return {
    async findById(installmentId) {
      const [row] = await db
        .select({ amountCents: installments.amountCents })
        .from(installments)
        .where(eq(installments.id, installmentId))
        .limit(1);
      if (!row) {
        return null;
      }
      const payments = await db
        .select()
        .from(installmentPayments)
        .where(eq(installmentPayments.installmentId, installmentId))
        .orderBy(asc(installmentPayments.paidAt), asc(installmentPayments.createdAt));

      return {
        amount: Money.fromCents(row.amountCents),
        payments: payments.map((payment) => ({
          id: payment.id,
          amount: Money.fromCents(payment.amountCents),
          paidAt: payment.paidAt,
          paymentMethod: toPaymentMethod(payment.paymentMethod),
          receivedByUserId: payment.receivedByUserId,
          registeredByUserId: payment.registeredByUserId,
        })),
      };
    },

    async addPayment(installmentId, payment) {
      await db.batch([
        db.insert(installmentPayments).values({
          installmentId,
          amountCents: payment.amount.toCents(),
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod,
          receivedByUserId: payment.receivedByUserId,
          registeredByUserId: payment.registeredByUserId,
        }),
        syncInstallmentPaidAt(db, installmentId),
      ]);
    },

    async updatePayment(payment) {
      const installmentId = await installmentIdOfPayment(db, payment.id);
      await db.batch([
        db
          .update(installmentPayments)
          .set({
            amountCents: payment.amount.toCents(),
            paidAt: payment.paidAt,
            paymentMethod: payment.paymentMethod,
            receivedByUserId: payment.receivedByUserId,
          })
          .where(eq(installmentPayments.id, payment.id)),
        syncInstallmentPaidAt(db, installmentId),
      ]);
    },

    async removePayment(paymentId) {
      const installmentId = await installmentIdOfPayment(db, paymentId);
      await db.batch([
        db.delete(installmentPayments).where(eq(installmentPayments.id, paymentId)),
        syncInstallmentPaidAt(db, installmentId),
      ]);
    },

    async findDueInMonth(campaignId, month) {
      const rows = await db
        .select({
          donorName: donors.name,
          amountCents: installments.amountCents,
          paidCents: paidCentsOfInstallment,
        })
        .from(installments)
        .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
        .innerJoin(donors, eq(pledges.donorId, donors.id))
        .where(and(eq(pledges.campaignId, campaignId), eq(installments.dueDate, month)));

      return rows.map((row) => ({
        donorName: row.donorName,
        amount: Money.fromCents(row.amountCents),
        paidAmount: Money.fromCents(row.paidCents),
      }));
    },

    async findInstallmentsByCampaign(campaignId) {
      return db
        .select({
          id: installments.id,
          dueDate: installments.dueDate,
          hasPayments: exists(
            db
              .select({ id: installmentPayments.id })
              .from(installmentPayments)
              .where(eq(installmentPayments.installmentId, installments.id)),
          ).mapWith(Boolean),
        })
        .from(installments)
        .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
        .where(eq(pledges.campaignId, campaignId));
    },

    async removeMany(installmentIds) {
      if (installmentIds.length === 0) {
        return;
      }
      await db.delete(installments).where(inArray(installments.id, installmentIds));
    },
  };
}
