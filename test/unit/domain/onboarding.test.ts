import { describe, expect, it } from "vitest";
import { selectAvailableGuideItems, tutorialGreeting } from "@/server/domain/onboarding";

const viewOnly = { canManageUsers: false, canManageCampaigns: false, canReceiveFunds: false };

const items = [
  { id: "overview" },
  { id: "receive", requires: "canReceiveFunds" as const },
  { id: "invite", requires: "canManageUsers" as const },
];

describe("selectAvailableGuideItems", () => {
  it("mostra a quem só visualiza apenas o que não exige nenhuma capacidade", () => {
    const available = selectAvailableGuideItems(items, viewOnly);

    expect(available.map((item) => item.id)).toEqual(["overview"]);
  });

  it("inclui o que exige uma capacidade que a pessoa tem, mantendo a ordem", () => {
    const available = selectAvailableGuideItems(items, { ...viewOnly, canReceiveFunds: true });

    expect(available.map((item) => item.id)).toEqual(["overview", "receive"]);
  });

  it("mostra tudo para quem tem todas as capacidades", () => {
    const available = selectAvailableGuideItems(items, {
      canManageUsers: true,
      canManageCampaigns: true,
      canReceiveFunds: true,
    });

    expect(available.map((item) => item.id)).toEqual(["overview", "receive", "invite"]);
  });
});

describe("tutorialGreeting", () => {
  it("cumprimenta pelo primeiro nome", () => {
    expect(tutorialGreeting("  Maria   da Silva ")).toBe("Olá, Maria!");
  });

  it("cumprimenta sem nome quando ele está em branco", () => {
    expect(tutorialGreeting("   ")).toBe("Olá!");
  });
});
