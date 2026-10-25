import { eq } from "drizzle-orm";
import type { LoosePledgeContributionRepository } from "@/server/application/add-loose-pledge-contribution";
import type { LooseContributionStore } from "@/server/application/correct-received-entry";
import { Money } from "@/server/domain/money";
import { parsePaymentMethod } from "@/server/domain/payment-method";
import type { DbClient } from "./client";
import { donors, loosePledgeContributions, loosePledges } from "./schema";

export function createLoosePledgeContributionRepository(
  db: DbClient,
): LoosePledgeContributionRepository {
  return {
    async create(loosePledgeId, contribution) {
      const [row] = await db
        .insert(loosePledgeContributions)
        .values({
          loosePledgeId,
          amountCents: contribution.amount.toCents(),
          date: contribution.date,
          paymentMethod: contribution.paymentMethod,
          receivedByUserId: contribution.receivedByUserId,
          registeredByUserId: contribution.registeredByUserId,
        })
        .returning({ id: loosePledgeContributions.id });

      if (!row) {
        throw new Error("Falha ao registrar contribuição");
      }
      return row;
    },
  };
}

export function createLooseContributionStore(db: DbClient): LooseContributionStore {
  return {
    async findById(id) {
      const [row] = await db
        .select({
          campaignId: loosePledges.campaignId,
          donorId: loosePledges.donorId,
          donorName: donors.name,
          amountCents: loosePledgeContributions.amountCents,
          date: loosePledgeContributions.date,
          paymentMethod: loosePledgeContributions.paymentMethod,
          receivedByUserId: loosePledgeContributions.receivedByUserId,
        })
        .from(loosePledgeContributions)
        .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
        .innerJoin(donors, eq(loosePledges.donorId, donors.id))
        .where(eq(loosePledgeContributions.id, id))
        .limit(1);
      if (!row) {
        return null;
      }
      return {
        campaignId: row.campaignId,
        subjectName: row.donorName,
        donorId: row.donorId,
        fields: {
          amount: Money.fromCents(row.amountCents),
          date: row.date,
          paymentMethod: parsePaymentMethod(row.paymentMethod),
          receivedByUserId: row.receivedByUserId,
        },
      };
    },

    async update(id, fields) {
      await db
        .update(loosePledgeContributions)
        .set({
          amountCents: fields.amount.toCents(),
          date: fields.date,
          paymentMethod: fields.paymentMethod,
          receivedByUserId: fields.receivedByUserId,
        })
        .where(eq(loosePledgeContributions.id, id));
    },

    async remove(id) {
      await db.delete(loosePledgeContributions).where(eq(loosePledgeContributions.id, id));
    },
  };
}
