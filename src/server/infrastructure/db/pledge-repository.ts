import { eq } from "drizzle-orm";
import type { PledgeRepository } from "@/server/application/create-pledge";
import type { PledgeListRepository } from "@/server/application/list-pledges";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { donors, installments, pledges, pledgeTypes } from "./schema";

export function createPledgeRepository(db: DbClient): PledgeRepository & PledgeListRepository {
  return {
    async create(pledge) {
      const [row] = await db
        .insert(pledges)
        .values({
          campaignId: pledge.campaignId,
          donorId: pledge.donorId,
          pledgeTypeId: pledge.pledgeTypeId,
        })
        .returning({ id: pledges.id });

      if (!row) {
        throw new Error("Falha ao criar carnê");
      }

      await db.insert(installments).values(
        pledge.installments.map((installment) => ({
          pledgeId: row.id,
          dueDate: installment.dueDate,
          amountCents: installment.amount.toCents(),
        })),
      );

      return row;
    },

    async findAllByCampaign(campaignId) {
      const pledgeRows = await db
        .select({
          id: pledges.id,
          donorName: donors.name,
          pledgeTypeName: pledgeTypes.name,
          installmentValueCents: pledgeTypes.installmentValueCents,
        })
        .from(pledges)
        .innerJoin(donors, eq(pledges.donorId, donors.id))
        .innerJoin(pledgeTypes, eq(pledges.pledgeTypeId, pledgeTypes.id))
        .where(eq(pledges.campaignId, campaignId));

      const installmentRows = await db
        .select({ pledgeId: installments.pledgeId, paidAt: installments.paidAt })
        .from(installments)
        .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
        .where(eq(pledges.campaignId, campaignId));

      const countsByPledge = new Map<string, { total: number; paid: number }>();
      for (const row of installmentRows) {
        const counts = countsByPledge.get(row.pledgeId) ?? { total: 0, paid: 0 };
        counts.total += 1;
        if (row.paidAt) {
          counts.paid += 1;
        }
        countsByPledge.set(row.pledgeId, counts);
      }

      return pledgeRows.map((row) => {
        const counts = countsByPledge.get(row.id) ?? { total: 0, paid: 0 };
        return {
          id: row.id,
          donorName: row.donorName,
          pledgeTypeName: row.pledgeTypeName,
          installmentValue: Money.fromCents(row.installmentValueCents),
          totalInstallments: counts.total,
          paidInstallments: counts.paid,
        };
      });
    },
  };
}
