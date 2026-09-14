import { describe, expect, it } from "vitest";
import {
  listActivityLog,
  type ActivityLogListEntry,
  type ActivityLogListRepository,
} from "@/server/application/list-activity-log";
import { Money } from "@/server/domain/money";

function createInMemoryActivityLogListRepository(
  entries: ActivityLogListEntry[],
): ActivityLogListRepository {
  return {
    findAll() {
      return Promise.resolve(entries);
    },
  };
}

describe("listActivityLog", () => {
  it("retorna os registros de atividade cadastrados", async () => {
    const entry: ActivityLogListEntry = {
      actorLabel: "maria@example.com",
      action: "installment_paid",
      subjectName: "Maria Souza",
      amount: Money.fromReais(100),
      occurredAt: new Date("2026-03-10"),
    };
    const repository = createInMemoryActivityLogListRepository([entry]);

    const result = await listActivityLog(repository);

    expect(result).toEqual([entry]);
  });

  it("retorna lista vazia quando não há registros", async () => {
    const repository = createInMemoryActivityLogListRepository([]);

    const result = await listActivityLog(repository);

    expect(result).toEqual([]);
  });
});
