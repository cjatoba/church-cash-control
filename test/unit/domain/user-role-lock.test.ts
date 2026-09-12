import { describe, expect, it } from "vitest";
import { resolveRoleForUpdate } from "@/server/domain/user-role-lock";

describe("resolveRoleForUpdate", () => {
  it("aplica o papel solicitado quando o alvo não é quem está editando", () => {
    const role = resolveRoleForUpdate("admin-1", "user-2", "fundraiser", "admin");

    expect(role).toBe("admin");
  });

  it("ignora o papel solicitado quando o usuário edita a própria conta", () => {
    const role = resolveRoleForUpdate("admin-1", "admin-1", "admin", "fundraiser");

    expect(role).toBe("admin");
  });
});
