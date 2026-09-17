import { eq, isNotNull, sql } from "drizzle-orm";
import type { CampaignRepository } from "@/server/application/create-campaign";
import type { CampaignListRepository } from "@/server/application/list-campaigns";
import type { CampaignPeriodReader } from "@/server/application/create-pledge";
import type { CampaignGoalPeriodReader } from "@/server/application/get-monthly-progress";
import type { CampaignUpdateRepository } from "@/server/application/update-campaign";
import type { CampaignArchiveRepository } from "@/server/application/archive-campaign";
import type { CampaignDetailRepository } from "@/server/application/get-campaign";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import {
  campaigns,
  installments,
  loosePledgeContributions,
  loosePledges,
  oneOffDonations,
  pledges,
} from "./schema";

async function sumRaisedByCampaign(db: DbClient): Promise<Map<string, number>> {
  const installmentRows = await db
    .select({
      campaignId: pledges.campaignId,
      totalCents: sql<number>`coalesce(sum(${installments.paidAmountCents}), 0)::int`,
    })
    .from(installments)
    .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
    .where(isNotNull(installments.paidAt))
    .groupBy(pledges.campaignId);

  const donationRows = await db
    .select({
      campaignId: oneOffDonations.campaignId,
      totalCents: sql<number>`coalesce(sum(${oneOffDonations.amountCents}), 0)::int`,
    })
    .from(oneOffDonations)
    .groupBy(oneOffDonations.campaignId);

  const loosePledgeContributionRows = await db
    .select({
      campaignId: loosePledges.campaignId,
      totalCents: sql<number>`coalesce(sum(${loosePledgeContributions.amountCents}), 0)::int`,
    })
    .from(loosePledgeContributions)
    .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
    .groupBy(loosePledges.campaignId);

  const totals = new Map<string, number>();
  for (const row of [...installmentRows, ...donationRows, ...loosePledgeContributionRows]) {
    totals.set(row.campaignId, (totals.get(row.campaignId) ?? 0) + row.totalCents);
  }
  return totals;
}

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
      const [rows, raisedByCampaign] = await Promise.all([
        db.select().from(campaigns),
        sumRaisedByCampaign(db),
      ]);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        goal: Money.fromCents(row.goalCents),
        startDate: row.startDate,
        endDate: row.endDate,
        active: row.active,
        raisedTotal: Money.fromCents(raisedByCampaign.get(row.id) ?? 0),
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
