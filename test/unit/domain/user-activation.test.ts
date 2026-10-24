import { describe, expect, it } from "vitest";
import { parseUserActivation } from "@/server/domain/user-activation";

describe("parseUserActivation", () => {
  it("normaliza celular para só dígitos", () => {
    const activation = parseUserActivation({
      phone: "(11) 95555-4444",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(activation).toEqual({
      phone: "11955554444",
      canManageUsers: true,
      canManageCampaigns: false,
      canReceiveFunds: true,
    });
  });

  it("aceita ativação sem nenhuma capacidade marcada (acesso de só visualização)", () => {
    const activation = parseUserActivation({
      phone: "11955554444",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(activation).toEqual({
      phone: "11955554444",
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("rejeita ativação sem celular — é o que dá acesso ao sistema", () => {
    expect(() =>
      parseUserActivation({
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });

  it("rejeita celular com menos de 10 dígitos", () => {
    expect(() =>
      parseUserActivation({
        phone: "123456789",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
