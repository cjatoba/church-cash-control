import { describe, expect, it } from "vitest";
import { parseInvite } from "@/server/domain/user-invite";

describe("parseInvite", () => {
  it("normaliza e-mail para minúsculas e telefone para só dígitos", () => {
    const invite = parseInvite({
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(invite).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: "11912345678",
      canManageUsers: true,
      canManageCampaigns: false,
      canReceiveFunds: true,
    });
  });

  it("trata telefone em branco (form vazio) como convite sem telefone", () => {
    const invite = parseInvite({
      email: "voluntario@igreja.exemplo",
      phone: "  ",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(invite.phone).toBeUndefined();
  });

  it("aceita convite sem telefone", () => {
    const invite = parseInvite({
      email: "voluntario@igreja.exemplo",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(invite).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: undefined,
      canManageUsers: true,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("aceita convite sem nenhuma capacidade marcada (acesso de só visualização)", () => {
    const invite = parseInvite({
      email: "voluntario@igreja.exemplo",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(invite).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: undefined,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("rejeita telefone com menos de 10 dígitos", () => {
    expect(() =>
      parseInvite({
        email: "voluntario@igreja.exemplo",
        phone: "123456789",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });

  it("rejeita e-mail inválido", () => {
    expect(() =>
      parseInvite({
        email: "não-é-email",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
