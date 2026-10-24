import { describe, expect, it } from "vitest";
import {
  completeTutorial,
  type TutorialProgressRepository,
} from "@/server/application/complete-tutorial";

function createInMemoryRepository(): TutorialProgressRepository & {
  hasCompleted: (userId: string) => boolean;
} {
  const completed = new Set<string>();
  return {
    markTutorialCompleted(userId) {
      completed.add(userId);
      return Promise.resolve();
    },
    hasCompleted: (userId) => completed.has(userId),
  };
}

describe("completeTutorial", () => {
  it("registra que a pessoa já viu o tutorial, sem afetar as demais", async () => {
    const repository = createInMemoryRepository();

    await completeTutorial(repository, "user-1");

    expect(repository.hasCompleted("user-1")).toBe(true);
    expect(repository.hasCompleted("user-2")).toBe(false);
  });

  it("pode ser chamado de novo (ex.: quem revê o tutorial pela Ajuda) sem erro", async () => {
    const repository = createInMemoryRepository();

    await completeTutorial(repository, "user-1");
    await completeTutorial(repository, "user-1");

    expect(repository.hasCompleted("user-1")).toBe(true);
  });
});
