import { parseActivityLogEntry, type ActivityLogEntry } from "../domain/activity-log";

export interface ActivityLogRepository {
  create(entry: ActivityLogEntry): Promise<void>;
}

export async function recordActivity(
  repository: ActivityLogRepository,
  input: unknown,
): Promise<void> {
  const entry = parseActivityLogEntry(input);
  await repository.create(entry);
}
