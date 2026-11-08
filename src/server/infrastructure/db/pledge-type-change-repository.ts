import { randomUUID } from "node:crypto";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { PledgeTypeChangeRepository } from "@/server/application/change-pledge-type";
import type { DbClient } from "./client";
import { syncInstallmentPaidAt, toPaymentMethod } from "./installment-repository";
import {
  installmentPayments,
  installments,
  loosePledgeContributions,
  loosePledges,
  pledges,
} from "./schema";

// Pagamento em parte também conta: converter o carnê apagaria esse dinheiro.
const hasPaidInstallment = sql<boolean>`exists (
  select 1 from ${installmentPayments}
  join ${installments} on ${installments.id} = ${installmentPayments.installmentId}
  where ${installments.pledgeId} = ${pledges.id}
)`;

const hasContribution = sql<boolean>`exists (
  select 1 from ${loosePledgeContributions}
  where ${loosePledgeContributions.loosePledgeId} = ${loosePledges.id}
)`;

// Conversões apagam o carnê antigo e criam o novo; db.batch roda tudo numa
// única transação, para nunca sobrar um doador sem carnê (ou com dois).
export function createPledgeTypeChangeRepository(db: DbClient): PledgeTypeChangeRepository {
  return {
    async findSource(kind, id) {
      if (kind === "fixed") {
        const [row] = await db
          .select({
            campaignId: pledges.campaignId,
            donorId: pledges.donorId,
            pledgeTypeId: pledges.pledgeTypeId,
            hasPayments: hasPaidInstallment,
          })
          .from(pledges)
          .where(eq(pledges.id, id))
          .limit(1);
        return row ?? null;
      }

      const [row] = await db
        .select({
          campaignId: loosePledges.campaignId,
          donorId: loosePledges.donorId,
          pledgeTypeId: loosePledges.pledgeTypeId,
          hasPayments: hasContribution,
        })
        .from(loosePledges)
        .where(eq(loosePledges.id, id))
        .limit(1);
      return row ?? null;
    },

    async findInstallments(pledgeId) {
      const [slots, payments] = await Promise.all([
        db
          .select({
            id: installments.id,
            dueDate: installments.dueDate,
            amountCents: installments.amountCents,
          })
          .from(installments)
          .where(eq(installments.pledgeId, pledgeId))
          .orderBy(asc(installments.dueDate)),
        db
          .select({
            id: installmentPayments.id,
            installmentId: installmentPayments.installmentId,
            paidAt: installmentPayments.paidAt,
            paidAmountCents: installmentPayments.amountCents,
            paymentMethod: installmentPayments.paymentMethod,
            receivedByUserId: installmentPayments.receivedByUserId,
            registeredByUserId: installmentPayments.registeredByUserId,
          })
          .from(installmentPayments)
          .innerJoin(installments, eq(installments.id, installmentPayments.installmentId))
          .where(eq(installments.pledgeId, pledgeId))
          .orderBy(asc(installmentPayments.paidAt), asc(installmentPayments.createdAt)),
      ]);

      return slots.map((slot) => ({
        ...slot,
        payments: payments
          .filter((payment) => payment.installmentId === slot.id)
          .map((payment) => ({
            id: payment.id,
            paidAt: payment.paidAt,
            paidAmountCents: payment.paidAmountCents,
            paymentMethod: toPaymentMethod(payment.paymentMethod),
            receivedByUserId: payment.receivedByUserId,
            registeredByUserId: payment.registeredByUserId,
          })),
      }));
    },

    // Os pagamentos do carnê são regravados como a recontagem deixou: os que
    // continuam iguais mantêm o id, os redistribuídos nascem de novo.
    async repriceFixed(pledgeId, pledgeTypeId, repricedInstallments) {
      const installmentIds = repricedInstallments.map((installment) => installment.id);
      const payments = repricedInstallments.flatMap((installment) =>
        installment.payments.map((payment) => ({
          ...(payment.id ? { id: payment.id } : {}),
          installmentId: installment.id,
          amountCents: payment.paidAmountCents,
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod,
          receivedByUserId: payment.receivedByUserId,
          registeredByUserId: payment.registeredByUserId,
        })),
      );
      await db.batch([
        db.update(pledges).set({ pledgeTypeId }).where(eq(pledges.id, pledgeId)),
        db
          .delete(installmentPayments)
          .where(inArray(installmentPayments.installmentId, installmentIds)),
        ...(payments.length > 0 ? [db.insert(installmentPayments).values(payments)] : []),
        ...repricedInstallments.map((installment) =>
          db
            .update(installments)
            .set({ amountCents: installment.amountCents })
            .where(eq(installments.id, installment.id)),
        ),
        ...installmentIds.map((installmentId) => syncInstallmentPaidAt(db, installmentId)),
      ]);
    },

    async relabelLoose(loosePledgeId, pledgeTypeId) {
      await db.update(loosePledges).set({ pledgeTypeId }).where(eq(loosePledges.id, loosePledgeId));
    },

    async convertFixedToLoose(pledgeId, loosePledge) {
      const id = randomUUID();
      await db.batch([
        db.insert(loosePledges).values({ id, ...loosePledge }),
        db.delete(pledges).where(eq(pledges.id, pledgeId)),
      ]);
      return { id };
    },

    async convertLooseToFixed(loosePledgeId, pledge) {
      const id = randomUUID();
      await db.batch([
        db.insert(pledges).values({
          id,
          campaignId: pledge.campaignId,
          donorId: pledge.donorId,
          pledgeTypeId: pledge.pledgeTypeId,
        }),
        db.insert(installments).values(
          pledge.installments.map((installment) => ({
            pledgeId: id,
            dueDate: installment.dueDate,
            amountCents: installment.amount.toCents(),
          })),
        ),
        db.delete(loosePledges).where(eq(loosePledges.id, loosePledgeId)),
      ]);
      return { id };
    },
  };
}
