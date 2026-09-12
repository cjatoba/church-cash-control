import { describe, expect, it } from "vitest";
import { canRegenerateTemporaryPassword } from "@/server/domain/temporary-password-reset";

describe("canRegenerateTemporaryPassword", () => {
  it("permite gerar nova senha temporária para quem ainda não trocou a senha", () => {
    expect(canRegenerateTemporaryPassword({ mustChangePassword: true })).toBe(true);
  });

  it("não permite gerar senha temporária para quem já trocou a senha", () => {
    expect(canRegenerateTemporaryPassword({ mustChangePassword: false })).toBe(false);
  });
});
