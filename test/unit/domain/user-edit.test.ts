import { describe, expect, it } from "vitest";
import { parseUserEdit } from "@/server/domain/user-edit";

describe("parseUserEdit", () => {
  it("normaliza e-mail para minúsculas e telefone para só dígitos", () => {
    const edit = parseUserEdit({
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      role: "fundraiser",
    });

    expect(edit).toEqual({
      email: "voluntario@igreja.exemplo",
      phone: "11912345678",
      role: "fundraiser",
    });
  });

  it("aceita edição sem telefone (remove o telefone cadastrado)", () => {
    const edit = parseUserEdit({ email: "voluntario@igreja.exemplo", role: "admin" });

    expect(edit.phone).toBeUndefined();
  });

  it("rejeita e-mail inválido", () => {
    expect(() => parseUserEdit({ email: "não-é-email", role: "admin" })).toThrow();
  });

  it("rejeita papel desconhecido", () => {
    expect(() => parseUserEdit({ email: "voluntario@igreja.exemplo", role: "outro" })).toThrow();
  });
});
