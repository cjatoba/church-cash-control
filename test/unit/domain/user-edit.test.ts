import { describe, expect, it } from "vitest";
import { parseUserEdit } from "@/server/domain/user-edit";

describe("parseUserEdit", () => {
  it("normaliza e-mail para minúsculas e telefone para só dígitos", () => {
    const edit = parseUserEdit({
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      canManageUsers: undefined,
      canManageCampaigns: "on",
      canReceiveFunds: "on",
    });

    expect(edit).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: "11912345678",
      canManageUsers: false,
      canManageCampaigns: true,
      canReceiveFunds: true,
    });
  });

  it("aceita edição sem telefone (remove o telefone cadastrado)", () => {
    const edit = parseUserEdit({
      email: "voluntario@igreja.exemplo",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(edit.phone).toBeUndefined();
  });

  it("aceita edição sem nenhuma capacidade marcada (acesso de só visualização)", () => {
    const edit = parseUserEdit({
      email: "voluntario@igreja.exemplo",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(edit).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: undefined,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
    });
  });

  it("rejeita e-mail inválido", () => {
    expect(() =>
      parseUserEdit({
        email: "não-é-email",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).toThrow();
  });
});
