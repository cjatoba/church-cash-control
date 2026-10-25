import { randomUUID } from "node:crypto";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { PledgeTypeChangeRepository } from "@/server/application/change-pledge-type";
import type { DbClient } from "./client";
import { installments, loosePledgeContributions, loosePledges, pledges } from "./schema";

const hasPaidInstallment = sql<boolean>`exists (
  select 1 from ${installments}
  where ${installments.pledgeId} = ${pledges.id} and ${isNotNull(installments.paidAt)}
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

    async repriceFixed(pledgeId, pledgeTypeId, installmentValue) {
      await db.batch([
        db.update(pledges).set({ pledgeTypeId }).where(eq(pledges.id, pledgeId)),
        db
          .update(installments)
          .set({ amountCents: installmentValue.toCents() })
          .where(and(eq(installments.pledgeId, pledgeId), isNull(installments.paidAt))),
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
