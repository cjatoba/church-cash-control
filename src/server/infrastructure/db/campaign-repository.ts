import type { CampaignRepository } from "@/server/application/create-campaign";
import type { DbClient } from "./client";
import { campaigns } from "./schema";

export function createCampaignRepository(db: DbClient): CampaignRepository {
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
  };
}
