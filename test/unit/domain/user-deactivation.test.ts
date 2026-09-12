import { describe, expect, it } from "vitest";
import { canDeactivateUser } from "@/server/domain/user-deactivation";

describe("canDeactivateUser", () => {
  it("permite desativar outro usuário", () => {
    expect(canDeactivateUser("admin-1", "user-2")).toBe(true);
  });

  it("não permite que o usuário desative a própria conta", () => {
    expect(canDeactivateUser("admin-1", "admin-1")).toBe(false);
  });
});
