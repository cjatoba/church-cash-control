import { describe, expect, it } from "vitest";
import { canRegenerateTemporaryPassword } from "@/server/domain/temporary-password-reset";

describe("canRegenerateTemporaryPassword", () => {
  it("permite gerar nova senha temporária para um usuário ativo com acesso ao sistema", () => {
    expect(canRegenerateTemporaryPassword({ active: true, phone: "11955554444" })).toBe(true);
  });

  it("não permite gerar senha temporária para um usuário desativado", () => {
    expect(canRegenerateTemporaryPassword({ active: false, phone: "11955554444" })).toBe(false);
  });

  it("não permite gerar senha temporária para quem não tem acesso ao sistema (sem celular)", () => {
    expect(canRegenerateTemporaryPassword({ active: true, phone: null })).toBe(false);
  });
});
