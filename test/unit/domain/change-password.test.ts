import { describe, expect, it } from "vitest";
import { parseNewPassword } from "@/server/domain/change-password";

describe("parseNewPassword", () => {
  const validInput = { newPassword: "novaSenha1", confirmNewPassword: "novaSenha1" };

  it("aceita quando a confirmação coincide com a nova senha", () => {
    const result = parseNewPassword(validInput);

    expect(result.newPassword).toBe("novaSenha1");
  });

  it("rejeita quando a confirmação não coincide com a nova senha", () => {
    expect(() =>
      parseNewPassword({ newPassword: "novaSenha1", confirmNewPassword: "outraSenha" }),
    ).toThrow();
  });

  it("rejeita nova senha com menos de 8 caracteres", () => {
    expect(() =>
      parseNewPassword({ newPassword: "1234567", confirmNewPassword: "1234567" }),
    ).toThrow();
  });
});
