import { describe, expect, it } from "vitest";
import {
  regenerateTemporaryPassword,
  type RegenerateTemporaryPasswordRepository,
} from "@/server/application/regenerate-temporary-password";

function createInMemoryRepository(
  user: { id: string; name: string; phone: string | null; active: boolean } | null,
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
  loginUrl: "https://church-cash-control.vercel.app/login",
};

describe("regenerateTemporaryPassword", () => {
  it("gera e persiste uma nova senha temporária para usuário ativo com acesso ao sistema", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      name: "Voluntária",
      phone: "11912345678",
      active: true,
    });

    const result = await regenerateTemporaryPassword(repository, dependencies, "user-1");

    expect(repository.updates).toEqual([{ userId: "user-1", passwordHash: "hashed:k7Rt9mQx" }]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
  });

  it("rejeita gerar senha temporária para usuário desativado", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      name: "Voluntária",
      phone: "11912345678",
      active: false,
    });

    await expect(regenerateTemporaryPassword(repository, dependencies, "user-1")).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita gerar senha temporária para quem não tem acesso ao sistema (sem celular)", async () => {
    const repository = createInMemoryRepository({
      id: "user-1",
      name: "Voluntário sem acesso",
      phone: null,
      active: true,
    });

    await expect(regenerateTemporaryPassword(repository, dependencies, "user-1")).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita usuário inexistente", async () => {
    const repository = createInMemoryRepository(null);

    await expect(regenerateTemporaryPassword(repository, dependencies, "user-1")).rejects.toThrow();
  });
});
