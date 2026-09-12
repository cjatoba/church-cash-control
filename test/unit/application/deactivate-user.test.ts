import { describe, expect, it } from "vitest";
import {
  deactivateUser,
  reactivateUser,
  type UserActiveRepository,
} from "@/server/application/deactivate-user";

function createInMemoryRepository(): UserActiveRepository & {
  updates: { userId: string; active: boolean }[];
} {
  const updates: { userId: string; active: boolean }[] = [];
  return {
    updates,
    setActive(userId, active) {
      updates.push({ userId, active });
      return Promise.resolve();
    },
  };
}

describe("deactivateUser", () => {
  it("desativa outro usuário", async () => {
    const repository = createInMemoryRepository();

    await deactivateUser(repository, "admin-1", "user-2");

    expect(repository.updates).toEqual([{ userId: "user-2", active: false }]);
  });

  it("rejeita desativar a própria conta sem persistir nada", async () => {
    const repository = createInMemoryRepository();

    await expect(deactivateUser(repository, "admin-1", "admin-1")).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });
});

describe("reactivateUser", () => {
  it("reativa um usuário", async () => {
    const repository = createInMemoryRepository();

    await reactivateUser(repository, "user-2");

    expect(repository.updates).toEqual([{ userId: "user-2", active: true }]);
  });
});
