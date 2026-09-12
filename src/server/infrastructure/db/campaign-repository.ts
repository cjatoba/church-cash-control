import { eq } from "drizzle-orm";
import type { CampaignRepository } from "@/server/application/create-campaign";
import type { CampaignListRepository } from "@/server/application/list-campaigns";
import type { CampaignPeriodReader } from "@/server/application/create-pledge";
import type { CampaignGoalPeriodReader } from "@/server/application/get-monthly-progress";
import type { CampaignUpdateRepository } from "@/server/application/update-campaign";
import type { CampaignArchiveRepository } from "@/server/application/archive-campaign";
import type { CampaignDetailRepository } from "@/server/application/get-campaign";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { campaigns } from "./schema";

export function createCampaignRepository(
  db: DbClient,
): CampaignRepository &
  CampaignListRepository &
  CampaignPeriodReader &
  CampaignGoalPeriodReader &
  CampaignUpdateRepository &
  CampaignArchiveRepository &
  CampaignDetailRepository {
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
        active: row.active,
      }));
    },

    async findPeriodById(campaignId) {
      const [row] = await db
        .select({ endDate: campaigns.endDate })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      return row ?? null;
    },

    async findById(campaignId) {
      const [row] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!row) {
        return null;
      }
      return {
        name: row.name,
        goal: Money.fromCents(row.goalCents),
        startDate: row.startDate,
        endDate: row.endDate,
        active: row.active,
      };
    },

    async update(id, campaign) {
      await db
        .update(campaigns)
        .set({
          name: campaign.name,
          goalCents: campaign.goal.toCents(),
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        })
        .where(eq(campaigns.id, id));
    },

    async setActive(id, active) {
      await db.update(campaigns).set({ active }).where(eq(campaigns.id, id));
    },
  };
}
