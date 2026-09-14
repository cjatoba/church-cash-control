import { describe, expect, it } from "vitest";
import { recordActivity, type ActivityLogRepository } from "@/server/application/record-activity";
import type { ActivityLogEntry } from "@/server/domain/activity-log";

function createInMemoryActivityLogRepository(): ActivityLogRepository & {
  saved: ActivityLogEntry[];
} {
  const saved: ActivityLogEntry[] = [];
  return {
    saved,
    create(entry) {
      saved.push(entry);
      return Promise.resolve();
    },
  };
}

describe("recordActivity", () => {
  const validInput = {
    actorUserId: "user-1",
    action: "campaign_archived",
    subjectName: "Campanha X",
    amountCents: null,
  };

  it("persiste um registro de atividade válido", async () => {
    const repository = createInMemoryActivityLogRepository();

    await recordActivity(repository, validInput);

    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.subjectName).toBe("Campanha X");
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryActivityLogRepository();

    await expect(recordActivity(repository, { ...validInput, actorUserId: "" })).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
