import { and, eq, gte, isNotNull, isNull, lt, sql, type SQL } from "drizzle-orm";
import { alias, type PgColumn } from "drizzle-orm/pg-core";
import type {
  DetailedReportReader,
  FundraisingReportReader,
} from "@/server/application/get-fundraising-report";
import type {
  ReportAggregateRow,
  ReportDateRange,
  ReportEntryKind,
} from "@/server/domain/fundraising-report";
import { Money } from "@/server/domain/money";
import type { PaymentMethod } from "@/server/domain/payment-method";
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

const receivedByUser = alias(users, "received_by_user");
const fromUser = alias(users, "from_user");
const toUser = alias(users, "to_user");

function toPaymentMethod(value: string | null): PaymentMethod | null {
  return value === "pix" || value === "cash" ? value : null;
}

function withinRange(column: PgColumn, range: ReportDateRange | null): SQL | undefined {
  return range ? and(gte(column, range.from), lt(column, range.until)) : undefined;
}

// paid_at é timestamp gravado à meia-noite UTC do dia escolhido; as demais
// datas são `date`. Em UTC as duas caem no mesmo mês.
function monthOf(column: PgColumn): SQL<string> {
  return sql<string>`to_char(${column} at time zone 'UTC', 'YYYY-MM-01')`;
}

function monthOfDate(column: PgColumn): SQL<string> {
  return sql<string>`to_char(${column}, 'YYYY-MM-01')`;
}

interface RawAggregate {
  month: string;
  paymentMethod: string | null;
  totalCents: number;
  count: number;
}

function toAggregateRows(kind: ReportEntryKind, rows: RawAggregate[]): ReportAggregateRow[] {
  return rows.map((row) => ({
    month: new Date(row.month),
    kind,
    paymentMethod: toPaymentMethod(row.paymentMethod),
    totalCents: row.totalCents,
    count: row.count,
  }));
}

export function createFundraisingReportRepository(
  db: DbClient,
): FundraisingReportReader & DetailedReportReader {
  return {
    async sumEntries(campaignId, range) {
      const installmentMonth = monthOf(installments.paidAt);
      const donationMonth = monthOfDate(oneOffDonations.date);
      const contributionMonth = monthOfDate(loosePledgeContributions.date);

      const [installmentRows, donationRows, contributionRows] = await Promise.all([
        db
          .select({
            month: installmentMonth,
            paymentMethod: installments.paymentMethod,
            totalCents: sql<number>`coalesce(sum(${installments.paidAmountCents}), 0)::int`,
            count: sql<number>`count(*)::int`,
          })
          .from(installments)
          .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
          .where(
            and(
              eq(pledges.campaignId, campaignId),
              isNotNull(installments.paidAt),
              withinRange(installments.paidAt, range),
            ),
          )
          .groupBy(installmentMonth, installments.paymentMethod),
        db
          .select({
            month: donationMonth,
            paymentMethod: oneOffDonations.paymentMethod,
            totalCents: sql<number>`coalesce(sum(${oneOffDonations.amountCents}), 0)::int`,
            count: sql<number>`count(*)::int`,
          })
          .from(oneOffDonations)
          .where(
            and(
              eq(oneOffDonations.campaignId, campaignId),
              withinRange(oneOffDonations.date, range),
            ),
          )
          .groupBy(donationMonth, oneOffDonations.paymentMethod),
        db
          .select({
            month: contributionMonth,
            paymentMethod: loosePledgeContributions.paymentMethod,
            totalCents: sql<number>`coalesce(sum(${loosePledgeContributions.amountCents}), 0)::int`,
            count: sql<number>`count(*)::int`,
          })
          .from(loosePledgeContributions)
          .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
          .where(
            and(
              eq(loosePledges.campaignId, campaignId),
              withinRange(loosePledgeContributions.date, range),
            ),
          )
          .groupBy(contributionMonth, loosePledgeContributions.paymentMethod),
      ]);

      return [
        ...toAggregateRows("installment", installmentRows),
        ...toAggregateRows("one_off_donation", donationRows),
        ...toAggregateRows("loose_contribution", contributionRows),
      ];
    },

    async sumPaidOutsideTeam(campaignId, range) {
      const [row] = await db
        .select({
          totalCents: sql<number>`coalesce(sum(${custodyTransfers.amountCents}), 0)::int`,
        })
        .from(custodyTransfers)
        .where(
          and(
            eq(custodyTransfers.campaignId, campaignId),
            isNull(custodyTransfers.toUserId),
            withinRange(custodyTransfers.transferDate, range),
          ),
        );
      return row?.totalCents ?? 0;
    },

    async findEntries(campaignId, range) {
      const [installmentRows, donationRows, contributionRows] = await Promise.all([
        db
          .select({
            donorName: donors.name,
            amountCents: installments.paidAmountCents,
            paidAt: installments.paidAt,
            dueDate: installments.dueDate,
            paymentMethod: installments.paymentMethod,
            receivedByName: receivedByUser.name,
          })
          .from(installments)
          .innerJoin(pledges, eq(installments.pledgeId, pledges.id))
          .innerJoin(donors, eq(pledges.donorId, donors.id))
          .leftJoin(receivedByUser, eq(installments.receivedByUserId, receivedByUser.id))
          .where(
            and(
              eq(pledges.campaignId, campaignId),
              isNotNull(installments.paidAt),
              withinRange(installments.paidAt, range),
            ),
          ),
        db
          .select({
            donorName: oneOffDonations.donorName,
            amountCents: oneOffDonations.amountCents,
            date: oneOffDonations.date,
            paymentMethod: oneOffDonations.paymentMethod,
            receivedByName: receivedByUser.name,
          })
          .from(oneOffDonations)
          .leftJoin(receivedByUser, eq(oneOffDonations.receivedByUserId, receivedByUser.id))
          .where(
            and(
              eq(oneOffDonations.campaignId, campaignId),
              withinRange(oneOffDonations.date, range),
            ),
          ),
        db
          .select({
            donorName: donors.name,
            amountCents: loosePledgeContributions.amountCents,
            date: loosePledgeContributions.date,
            paymentMethod: loosePledgeContributions.paymentMethod,
            receivedByName: receivedByUser.name,
          })
          .from(loosePledgeContributions)
          .innerJoin(loosePledges, eq(loosePledgeContributions.loosePledgeId, loosePledges.id))
          .innerJoin(donors, eq(loosePledges.donorId, donors.id))
          .innerJoin(
            receivedByUser,
            eq(loosePledgeContributions.receivedByUserId, receivedByUser.id),
          )
          .where(
            and(
              eq(loosePledges.campaignId, campaignId),
              withinRange(loosePledgeContributions.date, range),
            ),
          ),
      ]);

      return [
        ...installmentRows.map((row) => ({
          kind: "installment" as const,
          date: row.paidAt ?? row.dueDate,
          donorLabel: row.donorName,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          receivedByLabel: row.receivedByName,
          amount: Money.fromCents(row.amountCents ?? 0),
          dueDate: row.dueDate,
        })),
        ...donationRows.map((row) => ({
          kind: "one_off_donation" as const,
          date: row.date,
          donorLabel: row.donorName,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          receivedByLabel: row.receivedByName,
          amount: Money.fromCents(row.amountCents),
          dueDate: null,
        })),
        ...contributionRows.map((row) => ({
          kind: "loose_contribution" as const,
          date: row.date,
          donorLabel: row.donorName,
          paymentMethod: toPaymentMethod(row.paymentMethod),
          receivedByLabel: row.receivedByName,
          amount: Money.fromCents(row.amountCents),
          dueDate: null,
        })),
      ];
    },

    async findTransfers(campaignId, range) {
      const rows = await db
        .select({
          date: custodyTransfers.transferDate,
          fromName: fromUser.name,
          toUserName: toUser.name,
          recipientName: custodyTransfers.recipientName,
          amountCents: custodyTransfers.amountCents,
        })
        .from(custodyTransfers)
        .innerJoin(fromUser, eq(custodyTransfers.fromUserId, fromUser.id))
        .leftJoin(toUser, eq(custodyTransfers.toUserId, toUser.id))
        .where(
          and(
            eq(custodyTransfers.campaignId, campaignId),
            withinRange(custodyTransfers.transferDate, range),
          ),
        );

      return rows.map((row) => ({
        date: row.date,
        fromLabel: row.fromName,
        toLabel: row.toUserName ?? row.recipientName ?? "—",
        toVolunteer: row.toUserName !== null,
        amount: Money.fromCents(row.amountCents),
      }));
    },
  };
}
