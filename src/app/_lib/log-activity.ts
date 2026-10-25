import { recordActivity } from "@/server/application/record-activity";
import type { ActivityLogAction } from "@/server/domain/activity-log";
import { createActivityLogRepository } from "@/server/infrastructure/db/activity-log-repository";
import type { DbClient } from "@/server/infrastructure/db/client";

export function logActivity(
  db: DbClient,
  entry: {
    actorUserId: string;
    action: ActivityLogAction;
    subjectName: string;
    amountCents?: number | null;
    details?: string | null;
    donorId?: string | null;
  },
): Promise<void> {
  return recordActivity(createActivityLogRepository(db), {
    actorUserId: entry.actorUserId,
    action: entry.action,
    subjectName: entry.subjectName,
    amountCents: entry.amountCents ?? null,
    details: entry.details ?? null,
    donorId: entry.donorId ?? null,
  });
}
