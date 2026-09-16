import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { LoosePledgeRepository } from "@/server/application/create-loose-pledge";
import type { LoosePledgeStatusReader } from "@/server/application/add-loose-pledge-contribution";
import type { LoosePledgeStatusRepository } from "@/server/application/close-loose-pledge";
import type { LoosePledgeListRepository } from "@/server/application/list-loose-pledges";
import type { LoosePledgeDetailReader } from "@/server/application/get-loose-pledge-detail";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { donors, loosePledgeContributions, loosePledges, users } from "./schema";

const receivedByUser = alias(users, "loose_pledge_received_by_user");
const registeredByUser = alias(users, "loose_pledge_registered_by_user");

export function createLoosePledgeRepository(
  db: DbClient,
): LoosePledgeRepository &
  LoosePledgeStatusReader &
  LoosePledgeStatusRepository &
  LoosePledgeListRepository &
  LoosePledgeDetailReader {
  return {
    async create(input) {
      const [row] = await db
        .insert(loosePledges)
        .values({ campaignId: input.campaignId, donorId: input.donorId })
        .returning({ id: loosePledges.id });

      if (!row) {
        throw new Error("Falha ao criar carnê avulso");
      }
      return row;
    },

    async findStatusById(loosePledgeId) {
      const [row] = await db
        .select({ status: loosePledges.status })
        .from(loosePledges)
        .where(eq(loosePledges.id, loosePledgeId))
        .limit(1);

      return row ?? null;
    },

    async setStatus(id, status) {
      await db.update(loosePledges).set({ status }).where(eq(loosePledges.id, id));
    },

    async findAllByCampaign(campaignId) {
      const rows = await db
        .select({
          id: loosePledges.id,
          donorId: donors.id,
          donorName: donors.name,
          status: loosePledges.status,
          totalCents: sql<number>`coalesce(sum(${loosePledgeContributions.amountCents}), 0)::int`,
        })
        .from(loosePledges)
        .innerJoin(donors, eq(loosePledges.donorId, donors.id))
        .leftJoin(
          loosePledgeContributions,
          eq(loosePledgeContributions.loosePledgeId, loosePledges.id),
        )
        .where(eq(loosePledges.campaignId, campaignId))
        .groupBy(loosePledges.id, donors.id, donors.name, loosePledges.status);

      return rows.map((row) => ({
        id: row.id,
        donorId: row.donorId,
        donorName: row.donorName,
        status: row.status,
        totalContributed: Money.fromCents(row.totalCents),
      }));
    },

    async findById(loosePledgeId) {
      const [pledgeRow] = await db
        .select({
          id: loosePledges.id,
          donorName: donors.name,
          status: loosePledges.status,
        })
        .from(loosePledges)
        .innerJoin(donors, eq(loosePledges.donorId, donors.id))
        .where(eq(loosePledges.id, loosePledgeId))
        .limit(1);

      if (!pledgeRow) {
        return null;
      }

      const contributionRows = await db
        .select({
          id: loosePledgeContributions.id,
          amountCents: loosePledgeContributions.amountCents,
          date: loosePledgeContributions.date,
          paymentMethod: loosePledgeContributions.paymentMethod,
          receivedByEmail: receivedByUser.email,
          registeredByEmail: registeredByUser.email,
        })
        .from(loosePledgeContributions)
        .innerJoin(receivedByUser, eq(loosePledgeContributions.receivedByUserId, receivedByUser.id))
        .innerJoin(
          registeredByUser,
          eq(loosePledgeContributions.registeredByUserId, registeredByUser.id),
        )
        .where(eq(loosePledgeContributions.loosePledgeId, loosePledgeId));

      return {
        id: pledgeRow.id,
        donorName: pledgeRow.donorName,
        status: pledgeRow.status,
        contributions: contributionRows
          .map((row) => ({
            id: row.id,
            amount: Money.fromCents(row.amountCents),
            date: row.date,
            paymentMethod: row.paymentMethod,
            receivedByLabel: row.receivedByEmail,
            registeredByLabel: row.registeredByEmail,
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime()),
      };
    },
  };
}
