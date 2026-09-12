import { describe, expect, it } from "vitest";
import { parseInvite } from "@/server/domain/user-invite";

describe("parseInvite", () => {
  it("normaliza e-mail para minúsculas e telefone para só dígitos", () => {
    const invite = parseInvite({
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      role: "fundraiser",
    });

    expect(invite).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: "11912345678",
      role: "fundraiser",
    });
  });

  it("trata telefone em branco (form vazio) como convite sem telefone", () => {
    const invite = parseInvite({ email: "voluntario@igreja.exemplo", phone: "  ", role: "admin" });

    expect(invite.phone).toBeUndefined();
  });

  it("aceita convite sem telefone", () => {
    const invite = parseInvite({ email: "voluntario@igreja.exemplo", role: "admin" });

    expect(invite).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: undefined,
      role: "admin",
    });
  });

  it("rejeita telefone com menos de 10 dígitos", () => {
    expect(() =>
      parseInvite({ email: "voluntario@igreja.exemplo", phone: "123456789", role: "admin" }),
    ).toThrow();
  });

  it("rejeita e-mail inválido", () => {
    expect(() => parseInvite({ email: "não-é-email", role: "admin" })).toThrow();
  });

  it("rejeita papel desconhecido", () => {
    expect(() => parseInvite({ email: "voluntario@igreja.exemplo", role: "superadmin" })).toThrow();
  });
});
