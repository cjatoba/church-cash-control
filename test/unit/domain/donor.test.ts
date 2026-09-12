import { describe, expect, it } from "vitest";
import { parseDonor } from "@/server/domain/donor";

describe("parseDonor", () => {
  it("cria um doador a partir de dados válidos", () => {
    const donor = parseDonor({ name: "Maria Souza" });

    expect(donor.name).toBe("Maria Souza");
  });

  it("rejeita nome vazio", () => {
    expect(() => parseDonor({ name: "" })).toThrow();
  });

  it("rejeita nome só com espaços", () => {
    expect(() => parseDonor({ name: "   " })).toThrow();
  });
});
