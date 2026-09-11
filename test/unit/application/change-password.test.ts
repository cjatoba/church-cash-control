import { describe, expect, it } from "vitest";
import { changePassword, type UserPasswordRepository } from "@/server/application/change-password";

function createInMemoryRepository(): UserPasswordRepository & {
  updates: { userId: string; passwordHash: string }[];
} {
  const updates: { userId: string; passwordHash: string }[] = [];
  return {
    updates,
    completePasswordChange(userId, passwordHash) {
      updates.push({ userId, passwordHash });
      return Promise.resolve();
    },
  };
}

function fakeHashPassword(password: string): Promise<string> {
  return Promise.resolve(`hashed:${password}`);
}

describe("changePassword", () => {
  const validInput = { newPassword: "novaSenha1", confirmNewPassword: "novaSenha1" };

  it("gera o hash da nova senha e persiste via o repositório", async () => {
    const repository = createInMemoryRepository();

    await changePassword(repository, fakeHashPassword, "user-1", validInput);

    expect(repository.updates).toEqual([{ userId: "user-1", passwordHash: "hashed:novaSenha1" }]);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryRepository();

    await expect(
      changePassword(repository, fakeHashPassword, "user-1", {
        newPassword: "curta",
        confirmNewPassword: "curta",
      }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });
});
