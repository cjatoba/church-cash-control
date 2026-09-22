import { describe, expect, it } from "vitest";
import { formatPhoneLabel, phoneSchema } from "@/server/domain/phone";

describe("phoneSchema", () => {
  it("aceita celular formatado e normaliza para só dígitos", () => {
    expect(phoneSchema.parse("(11) 95555-4444")).toBe("11955554444");
  });

  it("aceita telefone fixo (10 dígitos)", () => {
    expect(phoneSchema.parse("(13) 3222-1234")).toBe("1332221234");
  });

  it("rejeita telefone com menos de 10 dígitos", () => {
    expect(() => phoneSchema.parse("123456789")).toThrow();
  });

  it("rejeita telefone com código de país (mais de 11 dígitos)", () => {
    expect(() => phoneSchema.parse("+55 13 98815-7820")).toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => phoneSchema.parse("")).toThrow();
  });
});

describe("formatPhoneLabel", () => {
  it("formata celular (11 dígitos) com hífen depois do 5º dígito", () => {
    expect(formatPhoneLabel("11955554444")).toBe("(11) 95555-4444");
  });

  it("formata fixo (10 dígitos) com hífen depois do 4º dígito", () => {
    expect(formatPhoneLabel("1332221234")).toBe("(13) 3222-1234");
  });
});
