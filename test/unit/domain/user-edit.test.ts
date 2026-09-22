import { describe, expect, it } from "vitest";
import { parseUserEdit } from "@/server/domain/user-edit";

describe("parseUserEdit", () => {
  it("normaliza celular para só dígitos", () => {
    const edit = parseUserEdit({
      phone: "(11) 95555-4444",
      canManageUsers: undefined,
      canManageCampaigns: "on",
      canReceiveFunds: "on",
    });

    expect(edit).toEqual({
      phone: "11955554444",
      canManageUsers: false,
      canManageCampaigns: true,
      canReceiveFunds: true,
    });
  });

  it("aceita edição sem nenhuma capacidade marcada (acesso de só visualização)", () => {
    const edit = parseUserEdit({
      phone: "11955554444",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(edit).toEqual({
      phone: "11955554444",
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("rejeita edição sem celular", () => {
    expect(() =>
      parseUserEdit({
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
