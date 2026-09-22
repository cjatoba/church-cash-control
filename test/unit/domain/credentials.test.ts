import { describe, expect, it } from "vitest";
import { parseCredentials } from "@/server/domain/credentials";

describe("parseCredentials", () => {
  it("aceita celular válido e senha com 8+ caracteres", () => {
    const credentials = parseCredentials({
      phone: "(11) 95555-4444",
      password: "senha1234",
    });

    expect(credentials.phone).toBe("11955554444");
    expect(credentials.password).toBe("senha1234");
  });

  it("rejeita celular inválido", () => {
    expect(() => parseCredentials({ phone: "123456789", password: "senha1234" })).toThrow();
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(() => parseCredentials({ phone: "11955554444", password: "1234567" })).toThrow();
  });
});
