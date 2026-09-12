import { and, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type {
  CustodyBalanceReader,
  CustodyTransferRepository,
} from "@/server/application/create-custody-transfer";
import type { MoneyInHandReader } from "@/server/application/get-money-in-hand";
import type { CustodyTransferListReader } from "@/server/application/list-custody-transfers";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { custodyTransfers, installments, oneOffDonations, pledges, users } from "./schema";

async function sumReceivedByUser(db: DbClient, campaignId: string): Promise<Map<string, number>> {
  const installmentRows = await db
    .select({
      userId: installments.receivedByUserId,
      totalCents: sql<number>`coalesce(sum(${installments.paidAmountCents}), 0)::int`,
    })
    .from(installments)
    .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
    .where(and(eq(pledges.campaignId, campaignId), isNotNull(installments.paidAt)))
    .groupBy(installments.receivedByUserId);

  const donationRows = await db
    .select({
      userId: oneOffDonations.receivedByUserId,
      totalCents: sql<number>`coalesce(sum(${oneOffDonations.amountCents}), 0)::int`,
    })
    .from(oneOffDonations)
    .where(eq(oneOffDonations.campaignId, campaignId))
    .groupBy(oneOffDonations.receivedByUserId);

  const totals = new Map<string, number>();
  for (const row of [...installmentRows, ...donationRows]) {
    if (!row.userId) {
      continue;
    }
    totals.set(row.userId, (totals.get(row.userId) ?? 0) + row.totalCents);
  }
  return totals;
}

async function sumTransferredByUser(
  db: DbClient,
  campaignId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      userId: custodyTransfers.fromUserId,
      totalCents: sql<number>`coalesce(sum(${custodyTransfers.amountCents}), 0)::int`,
    })
    .from(custodyTransfers)
    .where(eq(custodyTransfers.campaignId, campaignId))
    .groupBy(custodyTransfers.fromUserId);

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.userId, row.totalCents);
  }
  return totals;
}

const fromUser = alias(users, "from_user");
const registeredByUser = alias(users, "registered_by_user");

export function createCustodyRepository(
  db: DbClient,
): CustodyBalanceReader &
  CustodyTransferRepository &
  MoneyInHandReader &
  CustodyTransferListReader {
  return {
    async getAvailableBalance(campaignId, userId) {
      const [received, transferred] = await Promise.all([
        sumReceivedByUser(db, campaignId),
        sumTransferredByUser(db, campaignId),
      ]);
      return {
        receivedCents: received.get(userId) ?? 0,
        transferredCents: transferred.get(userId) ?? 0,
      };
    },

    async create(transfer) {
      const [row] = await db
        .insert(custodyTransfers)
        .values({
          campaignId: transfer.campaignId,
          fromUserId: transfer.fromUserId,
          registeredByUserId: transfer.registeredByUserId,
          recipientName: transfer.recipientName,
          amountCents: transfer.amount.toCents(),
          transferDate: transfer.transferDate,
          description: transfer.description,
        })
        .returning({ id: custodyTransfers.id });

      if (!row) {
        throw new Error("Falha ao registrar repasse");
      }
      return row;
    },

    async getTotalsByCampaign(campaignId) {
      const [allUsers, received, transferred] = await Promise.all([
        db.select({ id: users.id, email: users.email }).from(users),
        sumReceivedByUser(db, campaignId),
        sumTransferredByUser(db, campaignId),
      ]);

      return allUsers.map((user) => ({
        userId: user.id,
        userLabel: user.email,
        receivedCents: received.get(user.id) ?? 0,
        transferredCents: transferred.get(user.id) ?? 0,
      }));
    },

    async findByCampaign(campaignId) {
      const rows = await db
        .select({
          id: custodyTransfers.id,
          recipientName: custodyTransfers.recipientName,
          amountCents: custodyTransfers.amountCents,
          transferDate: custodyTransfers.transferDate,
          fromUserEmail: fromUser.email,
          registeredByUserEmail: registeredByUser.email,
        })
        .from(custodyTransfers)
        .innerJoin(fromUser, eq(custodyTransfers.fromUserId, fromUser.id))
        .innerJoin(registeredByUser, eq(custodyTransfers.registeredByUserId, registeredByUser.id))
        .where(eq(custodyTransfers.campaignId, campaignId));

      return rows
        .map((row) => ({
          id: row.id,
          fromUserLabel: row.fromUserEmail,
          recipientName: row.recipientName,
          amount: Money.fromCents(row.amountCents),
          transferDate: row.transferDate,
          registeredByUserLabel: row.registeredByUserEmail,
        }))
        .sort((a, b) => b.transferDate.getTime() - a.transferDate.getTime());
    },
  };
}
