import { describe, expect, it } from "vitest";
import { parseEnv } from "@/shared/env";

describe("parseEnv", () => {
  it("aceita uma configuração válida", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://user:pass@host/db",
      NODE_ENV: "test",
    });

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@host/db");
    expect(env.NODE_ENV).toBe("test");
  });

  it("assume NODE_ENV=development quando não informado", () => {
    const env = parseEnv({ DATABASE_URL: "postgresql://user:pass@host/db" });

    expect(env.NODE_ENV).toBe("development");
  });

  it("rejeita quando DATABASE_URL está ausente", () => {
    expect(() => parseEnv({})).toThrow();
  });

  it("rejeita quando DATABASE_URL não é uma URL postgres válida", () => {
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow();
  });
});
