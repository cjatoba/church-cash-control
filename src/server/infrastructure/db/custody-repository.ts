import { and, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type {
  CustodyBalanceReader,
  CustodyTransferRepository,
} from "@/server/application/create-custody-transfer";
import type { MoneyInHandReader } from "@/server/application/get-money-in-hand";
import type { CustodyTransferListReader } from "@/server/application/list-custody-transfers";
import type { CustodyTransferStore } from "@/server/application/correct-custody-transfer";
import type { PersonCustodyActivityReader } from "@/server/application/list-person-custody-activity";
import type { PaymentMethod } from "@/server/domain/payment-method";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import {
  custodyTransfers,
  donors,
  installments,
  loosePledgeContributions,
  loosePledges,
  oneOffDonations,
  pledges,
  users,
} from "./schema";

interface UserTotal {
  cents: number;
  count: number;
}

async function sumReceivedByUser(
  db: DbClient,
  campaignId: string,
): Promise<Map<string, UserTotal>> {
  const installmentRows = await db
    .select({
      userId: installments.receivedByUserId,
      totalCents: sql<number>`coalesce(sum(${installments.paidAmountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(installments)
    .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
    .where(and(eq(pledges.campaignId, campaignId), isNotNull(installments.paidAt)))
    .groupBy(installments.receivedByUserId);

  const donationRows = await db
    .select({
      userId: oneOffDonations.receivedByUserId,
      totalCents: sql<number>`coalesce(sum(${oneOffDonations.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(oneOffDonations)
    .where(eq(oneOffDonations.campaignId, campaignId))
    .groupBy(oneOffDonations.receivedByUserId);

  const loosePledgeContributionRows = await db
    .select({
      userId: loosePledgeContributions.receivedByUserId,
      totalCents: sql<number>`coalesce(sum(${loosePledgeContributions.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(loosePledgeContributions)
    .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
    .where(eq(loosePledges.campaignId, campaignId))
    .groupBy(loosePledgeContributions.receivedByUserId);

  const volunteerTransferRows = await db
    .select({
      userId: custodyTransfers.toUserId,
      totalCents: sql<number>`coalesce(sum(${custodyTransfers.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(custodyTransfers)
    .where(and(eq(custodyTransfers.campaignId, campaignId), isNotNull(custodyTransfers.toUserId)))
    .groupBy(custodyTransfers.toUserId);

  const totals = new Map<string, UserTotal>();
  for (const row of [
    ...installmentRows,
    ...donationRows,
    ...loosePledgeContributionRows,
    ...volunteerTransferRows,
  ]) {
    if (!row.userId) {
      continue;
    }
    const current = totals.get(row.userId) ?? { cents: 0, count: 0 };
    totals.set(row.userId, {
      cents: current.cents + row.totalCents,
      count: current.count + row.count,
    });
  }
  return totals;
}

async function sumTransferredByUser(
  db: DbClient,
  campaignId: string,
): Promise<Map<string, UserTotal>> {
  const rows = await db
    .select({
      userId: custodyTransfers.fromUserId,
      totalCents: sql<number>`coalesce(sum(${custodyTransfers.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(custodyTransfers)
    .where(eq(custodyTransfers.campaignId, campaignId))
    .groupBy(custodyTransfers.fromUserId);

  const totals = new Map<string, UserTotal>();
  for (const row of rows) {
    totals.set(row.userId, { cents: row.totalCents, count: row.count });
  }
  return totals;
}

const fromUser = alias(users, "from_user");
const toUser = alias(users, "to_user");
const registeredByUser = alias(users, "registered_by_user");

function recipientLabel(toUserName: string | null, recipientName: string | null): string {
  return toUserName ?? recipientName ?? "—";
}

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
        receivedCents: received.get(userId)?.cents ?? 0,
        transferredCents: transferred.get(userId)?.cents ?? 0,
      };
    },

    async create(transfer) {
      const [row] = await db
        .insert(custodyTransfers)
        .values({
          campaignId: transfer.campaignId,
          fromUserId: transfer.fromUserId,
          registeredByUserId: transfer.registeredByUserId,
          toUserId: transfer.toUserId,
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
        db.select({ id: users.id, name: users.name }).from(users),
        sumReceivedByUser(db, campaignId),
        sumTransferredByUser(db, campaignId),
      ]);

      return allUsers.map((user) => ({
        userId: user.id,
        userLabel: user.name,
        receivedCents: received.get(user.id)?.cents ?? 0,
        transferredCents: transferred.get(user.id)?.cents ?? 0,
        entryCount: received.get(user.id)?.count ?? 0,
        transferCount: transferred.get(user.id)?.count ?? 0,
      }));
    },

    async findByCampaign(campaignId) {
      const rows = await db
        .select({
          id: custodyTransfers.id,
          recipientName: custodyTransfers.recipientName,
          toUserName: toUser.name,
          amountCents: custodyTransfers.amountCents,
          transferDate: custodyTransfers.transferDate,
          fromUserName: fromUser.name,
          registeredByUserName: registeredByUser.name,
        })
        .from(custodyTransfers)
        .innerJoin(fromUser, eq(custodyTransfers.fromUserId, fromUser.id))
        .leftJoin(toUser, eq(custodyTransfers.toUserId, toUser.id))
        .innerJoin(registeredByUser, eq(custodyTransfers.registeredByUserId, registeredByUser.id))
        .where(eq(custodyTransfers.campaignId, campaignId));

      return rows
        .map((row) => ({
          id: row.id,
          fromUserLabel: row.fromUserName,
          recipientName: recipientLabel(row.toUserName, row.recipientName),
          toVolunteer: row.toUserName !== null,
          amount: Money.fromCents(row.amountCents),
          transferDate: row.transferDate,
          registeredByUserLabel: row.registeredByUserName,
        }))
        .sort((a, b) => b.transferDate.getTime() - a.transferDate.getTime());
    },
  };
}

function toPaymentMethod(value: string | null): PaymentMethod | null {
  return value === "pix" || value === "cash" ? value : null;
}

export function createCustodyTransferStore(db: DbClient): CustodyTransferStore {
  return {
    async findById(id) {
      const [row] = await db
        .select({
          campaignId: custodyTransfers.campaignId,
          fromUserId: custodyTransfers.fromUserId,
          fromUserName: fromUser.name,
          toUserId: custodyTransfers.toUserId,
          toUserName: toUser.name,
          recipientName: custodyTransfers.recipientName,
          amountCents: custodyTransfers.amountCents,
          transferDate: custodyTransfers.transferDate,
          description: custodyTransfers.description,
        })
        .from(custodyTransfers)
        .innerJoin(fromUser, eq(custodyTransfers.fromUserId, fromUser.id))
        .leftJoin(toUser, eq(custodyTransfers.toUserId, toUser.id))
        .where(eq(custodyTransfers.id, id))
        .limit(1);
      if (!row) {
        return null;
      }
      return {
        campaignId: row.campaignId,
        subjectName: `${row.fromUserName} para ${recipientLabel(row.toUserName, row.recipientName)}`,
        donorId: null,
        fields: {
          fromUserId: row.fromUserId,
          toUserId: row.toUserId,
          recipientName: row.recipientName,
          amount: Money.fromCents(row.amountCents),
          transferDate: row.transferDate,
          description: row.description,
        },
      };
    },

    async update(id, fields) {
      await db
        .update(custodyTransfers)
        .set({
          fromUserId: fields.fromUserId,
          toUserId: fields.toUserId,
          recipientName: fields.recipientName,
          amountCents: fields.amount.toCents(),
          transferDate: fields.transferDate,
          description: fields.description,
        })
        .where(eq(custodyTransfers.id, id));
    },

    async remove(id) {
      await db.delete(custodyTransfers).where(eq(custodyTransfers.id, id));
    },
  };
}

export function createPersonCustodyActivityReader(db: DbClient): PersonCustodyActivityReader {
  return {
    async findReceivedEntries(campaignId, userId) {
      const [installmentRows, donationRows, contributionRows, volunteerTransferRows] =
        await Promise.all([
          db
            .select({
              id: installments.id,
              pledgeId: installments.pledgeId,
              donorName: donors.name,
              amountCents: installments.paidAmountCents,
              paidAt: installments.paidAt,
              paymentMethod: installments.paymentMethod,
              registeredByName: registeredByUser.name,
              dueDate: installments.dueDate,
            })
            .from(installments)
            .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
            .innerJoin(donors, eq(pledges.donorId, donors.id))
            .leftJoin(registeredByUser, eq(installments.registeredByUserId, registeredByUser.id))
            .where(
              and(
                eq(pledges.campaignId, campaignId),
                eq(installments.receivedByUserId, userId),
                isNotNull(installments.paidAt),
              ),
            ),
          db
            .select({
              id: oneOffDonations.id,
              donorName: oneOffDonations.donorName,
              amountCents: oneOffDonations.amountCents,
              date: oneOffDonations.date,
              paymentMethod: oneOffDonations.paymentMethod,
              registeredByName: registeredByUser.name,
            })
            .from(oneOffDonations)
            .leftJoin(registeredByUser, eq(oneOffDonations.registeredByUserId, registeredByUser.id))
            .where(
              and(
                eq(oneOffDonations.campaignId, campaignId),
                eq(oneOffDonations.receivedByUserId, userId),
              ),
            ),
          db
            .select({
              id: loosePledgeContributions.id,
              loosePledgeId: loosePledgeContributions.loosePledgeId,
              donorName: donors.name,
              amountCents: loosePledgeContributions.amountCents,
              date: loosePledgeContributions.date,
              paymentMethod: loosePledgeContributions.paymentMethod,
              registeredByName: registeredByUser.name,
            })
            .from(loosePledgeContributions)
            .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
            .innerJoin(donors, eq(loosePledges.donorId, donors.id))
            .innerJoin(
              registeredByUser,
              eq(loosePledgeContributions.registeredByUserId, registeredByUser.id),
            )
            .where(
              and(
                eq(loosePledges.campaignId, campaignId),
                eq(loosePledgeContributions.receivedByUserId, userId),
              ),
            ),
          db
            .select({
              id: custodyTransfers.id,
              fromUserName: fromUser.name,
              amountCents: custodyTransfers.amountCents,
              transferDate: custodyTransfers.transferDate,
              registeredByName: registeredByUser.name,
            })
            .from(custodyTransfers)
            .innerJoin(fromUser, eq(custodyTransfers.fromUserId, fromUser.id))
            .innerJoin(
              registeredByUser,
              eq(custodyTransfers.registeredByUserId, registeredByUser.id),
            )
            .where(
              and(
                eq(custodyTransfers.campaignId, campaignId),
                eq(custodyTransfers.toUserId, userId),
              ),
            ),
        ]);

      return [
        ...installmentRows.map((row) => ({
          kind: "installment" as const,
          id: row.id,
          sourceId: row.pledgeId,
          donorLabel: row.donorName,
          amount: Money.fromCents(row.amountCents ?? 0),
          date: row.paidAt ?? row.dueDate,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          registeredByLabel: row.registeredByName,
          dueDate: row.dueDate,
        })),
        ...donationRows.map((row) => ({
          kind: "one_off_donation" as const,
          id: row.id,
          sourceId: null,
          donorLabel: row.donorName,
          amount: Money.fromCents(row.amountCents),
          date: row.date,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          registeredByLabel: row.registeredByName,
          dueDate: null,
        })),
        ...contributionRows.map((row) => ({
          kind: "loose_contribution" as const,
          id: row.id,
          sourceId: row.loosePledgeId,
          donorLabel: row.donorName,
          amount: Money.fromCents(row.amountCents),
          date: row.date,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          registeredByLabel: row.registeredByName,
          dueDate: null,
        })),
        ...volunteerTransferRows.map((row) => ({
          kind: "volunteer_transfer" as const,
          id: row.id,
          sourceId: null,
          donorLabel: row.fromUserName,
          amount: Money.fromCents(row.amountCents),
          date: row.transferDate,
          paymentMethod: null,
          registeredByLabel: row.registeredByName,
          dueDate: null,
        })),
      ];
    },

    async findTransfersFrom(campaignId, userId) {
      const rows = await db
        .select({
          id: custodyTransfers.id,
          recipientName: custodyTransfers.recipientName,
          toUserName: toUser.name,
          amountCents: custodyTransfers.amountCents,
          transferDate: custodyTransfers.transferDate,
          registeredByName: registeredByUser.name,
        })
        .from(custodyTransfers)
        .innerJoin(registeredByUser, eq(custodyTransfers.registeredByUserId, registeredByUser.id))
        .leftJoin(toUser, eq(custodyTransfers.toUserId, toUser.id))
        .where(
          and(eq(custodyTransfers.campaignId, campaignId), eq(custodyTransfers.fromUserId, userId)),
        );

      return rows.map((row) => ({
        id: row.id,
        recipientName: recipientLabel(row.toUserName, row.recipientName),
        toVolunteer: row.toUserName !== null,
        amount: Money.fromCents(row.amountCents),
        transferDate: row.transferDate,
        registeredByLabel: row.registeredByName,
      }));
    },
  };
}
