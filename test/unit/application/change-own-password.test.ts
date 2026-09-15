import { describe, expect, it } from "vitest";
import {
  changeOwnPassword,
  type OwnPasswordReader,
  type UserPasswordRepository,
} from "@/server/application/change-own-password";

function createDependencies(currentPasswordHash: string | null) {
  const updates: { userId: string; passwordHash: string }[] = [];
  const passwordReader: OwnPasswordReader = {
    findPasswordHash() {
      return Promise.resolve(currentPasswordHash);
    },
  };
  const repository: UserPasswordRepository = {
    completePasswordChange(userId, passwordHash) {
      updates.push({ userId, passwordHash });
      return Promise.resolve();
    },
  };
  const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
    Promise.resolve(hash === `hashed:${plain}`);
  const hashPassword = (plain: string): Promise<string> => Promise.resolve(`hashed:${plain}`);

  return { passwordReader, repository, verifyPassword, hashPassword, updates };
}

describe("changeOwnPassword", () => {
  const validInput = {
    currentPassword: "senhaAtual1",
    newPassword: "novaSenha1",
    confirmNewPassword: "novaSenha1",
  };

  it("troca a senha quando a senha atual confere", async () => {
    const dependencies = createDependencies("hashed:senhaAtual1");

    await changeOwnPassword(dependencies, "user-1", validInput);

    expect(dependencies.updates).toEqual([{ userId: "user-1", passwordHash: "hashed:novaSenha1" }]);
  });

  it("rejeita quando a senha atual informada está incorreta", async () => {
    const dependencies = createDependencies("hashed:outraSenha");

    await expect(changeOwnPassword(dependencies, "user-1", validInput)).rejects.toThrow(
      "Senha atual incorreta",
    );
    expect(dependencies.updates).toHaveLength(0);
  });

  it("rejeita quando o usuário não é encontrado", async () => {
    const dependencies = createDependencies(null);

    await expect(changeOwnPassword(dependencies, "user-1", validInput)).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
  });

  it("rejeita entrada inválida (nova senha igual à atual) sem persistir nada", async () => {
    const dependencies = createDependencies("hashed:senhaAtual1");

    await expect(
      changeOwnPassword(dependencies, "user-1", {
        currentPassword: "senhaAtual1",
        newPassword: "senhaAtual1",
        confirmNewPassword: "senhaAtual1",
      }),
    ).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
  });
});
