import { describe, expect, it } from "vitest";
import { parseChangeOwnPasswordInput, parseNewPassword } from "@/server/domain/change-password";

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

describe("parseChangeOwnPasswordInput", () => {
  const validInput = {
    currentPassword: "senhaAtual1",
    newPassword: "novaSenha1",
    confirmNewPassword: "novaSenha1",
  };

  it("aceita quando a confirmação coincide e a nova senha é diferente da atual", () => {
    const result = parseChangeOwnPasswordInput(validInput);

    expect(result.currentPassword).toBe("senhaAtual1");
    expect(result.newPassword).toBe("novaSenha1");
  });

  it("rejeita quando a confirmação não coincide com a nova senha", () => {
    expect(() =>
      parseChangeOwnPasswordInput({ ...validInput, confirmNewPassword: "outraSenha" }),
    ).toThrow();
  });

  it("rejeita quando a nova senha é igual à senha atual", () => {
    expect(() =>
      parseChangeOwnPasswordInput({
        currentPassword: "senhaAtual1",
        newPassword: "senhaAtual1",
        confirmNewPassword: "senhaAtual1",
      }),
    ).toThrow();
  });

  it("rejeita nova senha com menos de 8 caracteres", () => {
    expect(() =>
      parseChangeOwnPasswordInput({
        ...validInput,
        newPassword: "1234567",
        confirmNewPassword: "1234567",
      }),
    ).toThrow();
  });

  it("rejeita quando a senha atual não é informada", () => {
    expect(() => parseChangeOwnPasswordInput({ ...validInput, currentPassword: "" })).toThrow();
  });
});
