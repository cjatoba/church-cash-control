import { describe, expect, it } from "vitest";
import { canManageUsers } from "@/server/domain/user-role";

describe("canManageUsers", () => {
  it("permite administrador gerenciar usuários", () => {
    expect(canManageUsers("admin")).toBe(true);
  });

  it("não permite responsável pela arrecadação gerenciar usuários", () => {
    expect(canManageUsers("fundraiser")).toBe(false);
  });
});
