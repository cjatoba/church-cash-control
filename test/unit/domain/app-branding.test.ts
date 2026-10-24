import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_BRANDING,
  appIcons,
  appIconColors,
  parseAppBranding,
} from "@/server/domain/app-branding";

describe("parseAppBranding", () => {
  const validInput = {
    name: "  Caixa da Igreja X  ",
    shortName: " Caixa X ",
    icon: "church",
    color: "blue",
  };

  it("aceita nome, nome curto, ícone e cor válidos, sem espaços nas pontas", () => {
    expect(parseAppBranding(validInput)).toEqual({
      name: "Caixa da Igreja X",
      shortName: "Caixa X",
      icon: "church",
      color: "blue",
    });
  });

  it("exige o nome do app", () => {
    expect(() => parseAppBranding({ ...validInput, name: "   " })).toThrow(
      "Nome do app é obrigatório",
    );
  });

  it("limita o nome do app a 40 letras", () => {
    expect(() => parseAppBranding({ ...validInput, name: "a".repeat(41) })).toThrow(
      "Nome do app pode ter no máximo 40 letras",
    );
  });

  it("exige o nome curto", () => {
    expect(() => parseAppBranding({ ...validInput, shortName: "" })).toThrow(
      "Nome curto é obrigatório",
    );
  });

  it("limita o nome curto a 12 letras para não ficar cortado embaixo do ícone", () => {
    expect(() => parseAppBranding({ ...validInput, shortName: "a".repeat(13) })).toThrow(
      "Nome curto pode ter no máximo 12 letras",
    );
  });

  it("rejeita ícone ou cor fora das opções disponíveis", () => {
    expect(() => parseAppBranding({ ...validInput, icon: "foguete" })).toThrow();
    expect(() => parseAppBranding({ ...validInput, color: "rosa-choque" })).toThrow();
  });
});

describe("DEFAULT_APP_BRANDING", () => {
  it("é uma configuração válida, usada enquanto ninguém personalizou o app", () => {
    expect(parseAppBranding(DEFAULT_APP_BRANDING)).toEqual(DEFAULT_APP_BRANDING);
  });

  it("oferece 12 ícones e 8 cores", () => {
    expect(appIcons).toHaveLength(12);
    expect(appIconColors).toHaveLength(8);
  });
});
