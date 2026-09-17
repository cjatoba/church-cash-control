import { describe, expect, it } from "vitest";
import {
  closeLoosePledge,
  reopenLoosePledge,
  type LoosePledgeStatusRepository,
} from "@/server/application/close-loose-pledge";

function createInMemoryRepository(): LoosePledgeStatusRepository & {
  calls: { id: string; status: string }[];
} {
  const calls: { id: string; status: string }[] = [];
  return {
    calls,
    setStatus(id, status) {
      calls.push({ id, status });
      return Promise.resolve();
    },
  };
}

describe("closeLoosePledge", () => {
  it("marca o carnê avulso como encerrado", async () => {
    const repository = createInMemoryRepository();

    await closeLoosePledge(repository, "loose-pledge-1");

    expect(repository.calls).toEqual([{ id: "loose-pledge-1", status: "closed" }]);
  });
});

describe("reopenLoosePledge", () => {
  it("marca o carnê avulso como aberto novamente", async () => {
    const repository = createInMemoryRepository();

    await reopenLoosePledge(repository, "loose-pledge-1");

    expect(repository.calls).toEqual([{ id: "loose-pledge-1", status: "open" }]);
  });
});
