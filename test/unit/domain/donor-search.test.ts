import { describe, expect, it } from "vitest";
import { matchesDonorName } from "@/server/domain/donor-search";

describe("matchesDonorName", () => {
  it("encontra qualquer parte do nome", () => {
    expect(matchesDonorName("Cláudia da Silva", "silva")).toBe(true);
    expect(matchesDonorName("Paulo Silveira", "silv")).toBe(true);
  });

  it("ignora acentos e maiúsculas, tanto no nome quanto no que foi digitado", () => {
    expect(matchesDonorName("José Pereira", "jose")).toBe(true);
    expect(matchesDonorName("Joao Pereira", "JOÃO")).toBe(true);
    expect(matchesDonorName("Conceição", "conceicao")).toBe(true);
  });

  it("ignora espaços sobrando no que foi digitado", () => {
    expect(matchesDonorName("Ana Lima", "  ana ")).toBe(true);
  });

  it("não encontra quando o nome não contém o que foi digitado", () => {
    expect(matchesDonorName("Ana Lima", "rafael")).toBe(false);
  });

  it("pesquisa em branco mostra todos os doadores", () => {
    expect(matchesDonorName("Ana Lima", "")).toBe(true);
    expect(matchesDonorName("Ana Lima", "   ")).toBe(true);
  });
});
