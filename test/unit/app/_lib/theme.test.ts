import { describe, expect, it } from "vitest";
import { parseThemePreference } from "@/app/_lib/theme";

describe("parseThemePreference", () => {
  it("aceita as preferências claro e escuro", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("segue o sistema quando não há preferência salva", () => {
    expect(parseThemePreference(undefined)).toBe("system");
  });

  it("segue o sistema quando o valor salvo é desconhecido", () => {
    expect(parseThemePreference("roxo")).toBe("system");
  });
});
