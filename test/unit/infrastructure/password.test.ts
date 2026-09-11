import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/infrastructure/auth/password";

describe("hashPassword / verifyPassword", () => {
  it("verifica com sucesso a senha correta contra o hash gerado", async () => {
    const hash = await hashPassword("senha1234");

    await expect(verifyPassword("senha1234", hash)).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta contra o hash", async () => {
    const hash = await hashPassword("senha1234");

    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", async () => {
    const [first, second] = await Promise.all([
      hashPassword("senha1234"),
      hashPassword("senha1234"),
    ]);

    expect(first).not.toBe(second);
  });
});
