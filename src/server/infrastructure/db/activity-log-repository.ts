import { desc, eq, sql } from "drizzle-orm";
import type { ActivityLogRepository } from "@/server/application/record-activity";
import type { DonorActivityRedactor } from "@/server/application/anonymize-donor";
import type { ActivityLogListRepository } from "@/server/application/list-activity-log";
import { ACTIVITY_LOG_ACTIONS, type ActivityLogAction } from "@/server/domain/activity-log";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { activityLog, users } from "./schema";

const ACTIVITY_LOG_LIST_LIMIT = 200;

function toActivityLogAction(value: string): ActivityLogAction {
  const action = ACTIVITY_LOG_ACTIONS.find((known) => known === value);
  if (!action) {
    throw new Error("Ação de log de atividade desconhecida");
  }
  return action;
}

export function createActivityLogRepository(
  db: DbClient,
): ActivityLogRepository & ActivityLogListRepository & DonorActivityRedactor {
  return {
    async create(entry) {
      await db.insert(activityLog).values({
        actorUserId: entry.actorUserId,
        action: entry.action,
        subjectName: entry.subjectName,
        amountCents: entry.amount?.toCents() ?? null,
        details: entry.details,
        donorId: entry.donorId,
        occurredAt: entry.occurredAt,
      });
    },

    // Só "donor_updated" tem nome do doador no detalhe ("Nome: A → B"); nas
    // demais ações o detalhe fala de valor, data, forma ou quem recebeu.
    async redactDonor(donorId, replacementName) {
      await db
        .update(activityLog)
        .set({
          subjectName: replacementName,
          details: sql`case when ${activityLog.action} = 'donor_updated' then null else ${activityLog.details} end`,
        })
        .where(eq(activityLog.donorId, donorId));
    },

    async findAll() {
      const rows = await db
        .select({
          actorName: users.name,
          action: activityLog.action,
          subjectName: activityLog.subjectName,
          amountCents: activityLog.amountCents,
          details: activityLog.details,
          occurredAt: activityLog.occurredAt,
        })
        .from(activityLog)
        .innerJoin(users, eq(activityLog.actorUserId, users.id))
        .orderBy(desc(activityLog.occurredAt))
        .limit(ACTIVITY_LOG_LIST_LIMIT);

      return rows.map((row) => ({
        actorLabel: row.actorName,
        action: toActivityLogAction(row.action),
        subjectName: row.subjectName,
        amount: row.amountCents === null ? null : Money.fromCents(row.amountCents),
        details: row.details,
        occurredAt: row.occurredAt,
      }));
    },
  };
}
