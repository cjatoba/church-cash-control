import { describe, expect, it } from "vitest";
import { parseEnv } from "@/shared/env";

describe("parseEnv", () => {
  it("aceita uma configuração válida", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://user:pass@host/db",
      AUTH_SECRET: "a-very-secret-value",
      NODE_ENV: "test",
    });

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@host/db");
    expect(env.AUTH_SECRET).toBe("a-very-secret-value");
    expect(env.NODE_ENV).toBe("test");
  });

  it("assume NODE_ENV=development quando não informado", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://user:pass@host/db",
      AUTH_SECRET: "a-very-secret-value",
    });

    expect(env.NODE_ENV).toBe("development");
  });

  it("rejeita quando DATABASE_URL está ausente", () => {
    expect(() => parseEnv({ AUTH_SECRET: "a-very-secret-value" })).toThrow();
  });

  it("rejeita quando DATABASE_URL não é uma URL postgres válida", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "not-a-url", AUTH_SECRET: "a-very-secret-value" }),
    ).toThrow();
  });

  it("rejeita quando AUTH_SECRET está ausente", () => {
    expect(() => parseEnv({ DATABASE_URL: "postgresql://user:pass@host/db" })).toThrow();
  });
});
