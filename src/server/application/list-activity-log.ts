import type { ActivityLogAction } from "../domain/activity-log";
import type { Money } from "../domain/money";

export interface ActivityLogListEntry {
  actorLabel: string;
  action: ActivityLogAction;
  subjectName: string;
  amount: Money | null;
  occurredAt: Date;
}

export interface ActivityLogListRepository {
  findAll(): Promise<ActivityLogListEntry[]>;
}

export function listActivityLog(
  repository: ActivityLogListRepository,
): Promise<ActivityLogListEntry[]> {
  return repository.findAll();
}
