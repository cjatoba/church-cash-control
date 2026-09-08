import { describe, expect, it } from "vitest";
import { parseCredentials } from "@/server/domain/credentials";

describe("parseCredentials", () => {
  it("aceita email válido e senha com 8+ caracteres", () => {
    const credentials = parseCredentials({
      email: "treasurer@example.com",
      password: "senha1234",
    });

    expect(credentials.email).toBe("treasurer@example.com");
    expect(credentials.password).toBe("senha1234");
  });

  it("rejeita email inválido", () => {
    expect(() => parseCredentials({ email: "not-an-email", password: "senha1234" })).toThrow();
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(() =>
      parseCredentials({ email: "treasurer@example.com", password: "1234567" }),
    ).toThrow();
  });

  it("normaliza o email para minúsculas", () => {
    const credentials = parseCredentials({
      email: "Treasurer@Example.com",
      password: "senha1234",
    });

    expect(credentials.email).toBe("treasurer@example.com");
  });
});
