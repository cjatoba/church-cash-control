import type { LoosePledgeContributionRepository } from "@/server/application/add-loose-pledge-contribution";
import type { DbClient } from "./client";
import { loosePledgeContributions } from "./schema";

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
