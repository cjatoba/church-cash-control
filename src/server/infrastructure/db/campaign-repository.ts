import type { CampaignRepository } from "@/server/application/create-campaign";
import type { CampaignListRepository } from "@/server/application/list-campaigns";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { campaigns } from "./schema";

export function createCampaignRepository(
  db: DbClient,
): CampaignRepository & CampaignListRepository {
  return {
    async create(campaign) {
      const [row] = await db
        .insert(campaigns)
        .values({
          name: campaign.name,
          goalCents: campaign.goal.toCents(),
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        })
        .returning({ id: campaigns.id });

      if (!row) {
        throw new Error("Falha ao criar campanha");
      }
      return row;
    },

    async findAll() {
      const rows = await db.select().from(campaigns);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        goal: Money.fromCents(row.goalCents),
        startDate: row.startDate,
        endDate: row.endDate,
      }));
    },
  };
}
