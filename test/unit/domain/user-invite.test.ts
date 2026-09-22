import { describe, expect, it } from "vitest";
import { parseInvite } from "@/server/domain/user-invite";

describe("parseInvite", () => {
  it("normaliza celular para só dígitos quando informado", () => {
    const invite = parseInvite({
      name: "Maria Souza",
      phone: "(11) 95555-4444",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(invite).toEqual({
      name: "Maria Souza",
      phone: "11955554444",
      canManageUsers: true,
      canManageCampaigns: false,
      canReceiveFunds: true,
    });
  });

  it("aceita convite sem celular (voluntário sem acesso ao sistema, só nome)", () => {
    const invite = parseInvite({
      name: "João Pereira",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(invite).toEqual({
      name: "João Pereira",
      phone: undefined,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("ignora capacidades marcadas quando não há celular — sem acesso, sem capacidade", () => {
    const invite = parseInvite({
      name: "João Pereira",
      canManageUsers: "on",
      canManageCampaigns: "on",
      canReceiveFunds: "on",
    });

    expect(invite.canManageUsers).toBe(false);
    expect(invite.canManageCampaigns).toBe(false);
    expect(invite.canReceiveFunds).toBe(false);
  });

  it("rejeita convite sem nome", () => {
    expect(() =>
      parseInvite({
        phone: "11955554444",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });

  it("rejeita celular com menos de 10 dígitos quando informado", () => {
    expect(() =>
      parseInvite({
        name: "Maria Souza",
        phone: "123456789",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
