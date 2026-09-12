import { describe, expect, it } from "vitest";
import { canManageUsers } from "@/server/domain/user-role";

describe("canManageUsers", () => {
  it("permite administrador gerenciar usuários", () => {
    expect(canManageUsers("admin")).toBe(true);
  });

  it("não permite tesoureiro gerenciar usuários", () => {
    expect(canManageUsers("treasurer")).toBe(false);
  });
});
