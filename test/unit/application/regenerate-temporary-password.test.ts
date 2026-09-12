import { describe, expect, it } from "vitest";
import {
  regenerateTemporaryPassword,
  type RegenerateTemporaryPasswordRepository,
} from "@/server/application/regenerate-temporary-password";

function createInMemoryRepository(
  user: { id: string; email: string; phone: string | null; mustChangePassword: boolean } | null,
): RegenerateTemporaryPasswordRepository & { updates: { userId: string; passwordHash: string }[] } {
  const updates: { userId: string; passwordHash: string }[] = [];
  return {
    updates,
    findById(userId) {
      return Promise.resolve(user?.id === userId ? user : null);
    },
    updatePasswordHash(userId, passwordHash) {
      updates.push({ userId, passwordHash });
      return Promise.resolve();
    },
  };
}

const dependencies = {
  generateTemporaryPassword: () => "k7Rt9mQx",
  hashPassword: (password: string) => Promise.resolve(`hashed:${password}`),
};

describe("regenerateTemporaryPassword", () => {
  it("gera e persiste uma nova senha temporária para usuário pendente", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      email: "voluntario@igreja.exemplo",
      phone: "11912345678",
      mustChangePassword: true,
    });

    const result = await regenerateTemporaryPassword(repository, dependencies, "user-1");

    expect(repository.updates).toEqual([{ userId: "user-1", passwordHash: "hashed:k7Rt9mQx" }]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
  });

  it("não gera link do WhatsApp quando o usuário não tem telefone cadastrado", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      email: "voluntario@igreja.exemplo",
      phone: null,
      mustChangePassword: true,
    });

    const result = await regenerateTemporaryPassword(repository, dependencies, "user-1");

    expect(result.whatsappLink).toBeUndefined();
  });

  it("rejeita gerar senha temporária para usuário que já trocou a senha", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      email: "voluntario@igreja.exemplo",
      phone: null,
      mustChangePassword: false,
    });

    await expect(regenerateTemporaryPassword(repository, dependencies, "user-1")).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita usuário inexistente", async () => {
    const repository = createInMemoryRepository(null);

    await expect(regenerateTemporaryPassword(repository, dependencies, "user-1")).rejects.toThrow();
  });
});
