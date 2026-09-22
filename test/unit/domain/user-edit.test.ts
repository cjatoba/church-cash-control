import { describe, expect, it } from "vitest";
import { parseUserEdit } from "@/server/domain/user-edit";

describe("parseUserEdit", () => {
  it("normaliza celular para só dígitos quando informado", () => {
    const edit = parseUserEdit({
      name: "Maria Souza",
      phone: "(11) 95555-4444",
      canManageUsers: undefined,
      canManageCampaigns: "on",
      canReceiveFunds: "on",
    });

    expect(edit).toEqual({
      name: "Maria Souza",
      phone: "11955554444",
      canManageUsers: false,
      canManageCampaigns: true,
      canReceiveFunds: true,
    });
  });

  it("aceita edição sem celular (voluntário sem acesso ao sistema)", () => {
    const edit = parseUserEdit({
      name: "João Pereira",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(edit).toEqual({
      name: "João Pereira",
      phone: undefined,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("ignora capacidades marcadas quando não há celular", () => {
    const edit = parseUserEdit({
      name: "João Pereira",
      canManageUsers: "on",
      canManageCampaigns: "on",
      canReceiveFunds: "on",
    });

    expect(edit.canManageUsers).toBe(false);
    expect(edit.canManageCampaigns).toBe(false);
    expect(edit.canReceiveFunds).toBe(false);
  });

  it("rejeita edição sem nome", () => {
    expect(() =>
      parseUserEdit({
        phone: "11955554444",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
