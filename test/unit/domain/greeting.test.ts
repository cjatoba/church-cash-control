import { describe, expect, it } from "vitest";
import { greetByFirstName } from "@/server/domain/greeting";

describe("greetByFirstName", () => {
  it("cumprimenta pelo primeiro nome", () => {
    expect(greetByFirstName("  Maria   da Silva ")).toBe("Olá, Maria!");
  });

  it("cumprimenta sem nome quando ele está em branco", () => {
    expect(greetByFirstName("   ")).toBe("Olá!");
  });
});
