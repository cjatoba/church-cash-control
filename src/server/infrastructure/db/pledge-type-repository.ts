import { eq } from "drizzle-orm";
import type { PledgeTypeRepository } from "@/server/application/create-pledge-type";
import type { PledgeTypeReader } from "@/server/application/create-pledge";
import type { PledgeTypeListRepository } from "@/server/application/list-pledge-types";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { pledgeTypes } from "./schema";

export function createPledgeTypeRepository(
  db: DbClient,
): PledgeTypeRepository & PledgeTypeReader & PledgeTypeListRepository {
  return {
    async create(pledgeType) {
      const [row] = await db
        .insert(pledgeTypes)
        .values({
          campaignId: pledgeType.campaignId,
          name: pledgeType.name,
          installmentValueCents: pledgeType.installmentValue.toCents(),
        })
        .returning({ id: pledgeTypes.id });

      if (!row) {
        throw new Error("Falha ao criar tipo de carnê");
      }
      return row;
    },

    async findById(pledgeTypeId) {
      const [row] = await db
        .select()
        .from(pledgeTypes)
        .where(eq(pledgeTypes.id, pledgeTypeId))
        .limit(1);

      if (!row) {
        return null;
      }
      return {
        campaignId: row.campaignId,
        installmentValue: Money.fromCents(row.installmentValueCents),
      };
    },

    async findAllByCampaign(campaignId) {
      const rows = await db
        .select()
        .from(pledgeTypes)
        .where(eq(pledgeTypes.campaignId, campaignId));

      return rows.map((row) => ({
        id: row.id,
        campaignId: row.campaignId,
        name: row.name,
        installmentValue: Money.fromCents(row.installmentValueCents),
      }));
    },
  };
}
