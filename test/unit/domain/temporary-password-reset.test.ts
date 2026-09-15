import { describe, expect, it } from "vitest";
import { canRegenerateTemporaryPassword } from "@/server/domain/temporary-password-reset";

describe("canRegenerateTemporaryPassword", () => {
  it("permite gerar nova senha temporária para um usuário ativo", () => {
    expect(canRegenerateTemporaryPassword({ active: true })).toBe(true);
  });

  it("não permite gerar senha temporária para um usuário desativado", () => {
    expect(canRegenerateTemporaryPassword({ active: false })).toBe(false);
  });
});
