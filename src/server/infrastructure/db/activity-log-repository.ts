import { desc, eq } from "drizzle-orm";
import type { ActivityLogRepository } from "@/server/application/record-activity";
import type { ActivityLogListRepository } from "@/server/application/list-activity-log";
import type { ActivityLogAction } from "@/server/domain/activity-log";
import { Money } from "@/server/domain/money";
import { formatPhoneLabel } from "@/server/domain/phone";
import type { DbClient } from "./client";
import { activityLog, users } from "./schema";

const ACTIVITY_LOG_LIST_LIMIT = 200;

function toActivityLogAction(value: string): ActivityLogAction {
  if (
    value === "installment_paid" ||
    value === "installment_payment_corrected" ||
    value === "installment_payment_reverted" ||
    value === "campaign_updated" ||
    value === "campaign_archived" ||
    value === "campaign_restored" ||
    value === "transaction_category_archived" ||
    value === "transaction_category_restored"
  ) {
    return value;
  }
  throw new Error("Ação de log de atividade desconhecida");
}

export function createActivityLogRepository(
  db: DbClient,
): ActivityLogRepository & ActivityLogListRepository {
  return {
    async create(entry) {
      await db.insert(activityLog).values({
        actorUserId: entry.actorUserId,
        action: entry.action,
        subjectName: entry.subjectName,
        amountCents: entry.amount?.toCents() ?? null,
        occurredAt: entry.occurredAt,
      });
    },

    async findAll() {
      const rows = await db
        .select({
          actorPhone: users.phone,
          action: activityLog.action,
          subjectName: activityLog.subjectName,
          amountCents: activityLog.amountCents,
          occurredAt: activityLog.occurredAt,
        })
        .from(activityLog)
        .innerJoin(users, eq(activityLog.actorUserId, users.id))
        .orderBy(desc(activityLog.occurredAt))
        .limit(ACTIVITY_LOG_LIST_LIMIT);

      return rows.map((row) => ({
        actorLabel: formatPhoneLabel(row.actorPhone),
        action: toActivityLogAction(row.action),
        subjectName: row.subjectName,
        amount: row.amountCents === null ? null : Money.fromCents(row.amountCents),
        occurredAt: row.occurredAt,
      }));
    },
  };
}
