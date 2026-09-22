import { describe, expect, it } from "vitest";
import { parseInvite } from "@/server/domain/user-invite";

describe("parseInvite", () => {
  it("normaliza celular para só dígitos", () => {
    const invite = parseInvite({
      phone: "(11) 95555-4444",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(invite).toEqual({
      phone: "11955554444",
      canManageUsers: true,
      canManageCampaigns: false,
      canReceiveFunds: true,
    });
  });

  it("aceita convite sem nenhuma capacidade marcada (acesso de só visualização)", () => {
    const invite = parseInvite({
      phone: "11955554444",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(invite).toEqual({
      phone: "11955554444",
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("rejeita convite sem celular", () => {
    expect(() =>
      parseInvite({
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });

  it("rejeita celular com menos de 10 dígitos", () => {
    expect(() =>
      parseInvite({
        phone: "123456789",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
