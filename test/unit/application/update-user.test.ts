import { describe, expect, it } from "vitest";
import { updateUser, type UpdateUserRepository } from "@/server/application/update-user";

interface StoredUser {
  id: string;
  email: string;
  phone: string | null;
  role: "admin" | "fundraiser";
}

function createInMemoryRepository(
  users: StoredUser[],
): UpdateUserRepository & { updates: { userId: string; input: unknown }[] } {
  const updates: { userId: string; input: unknown }[] = [];
  return {
    updates,
    findUserForEdit(userId) {
      return Promise.resolve(users.find((user) => user.id === userId) ?? null);
    },
    emailInUseByAnotherUser(email, userId) {
      return Promise.resolve(users.some((user) => user.email === email && user.id !== userId));
    },
    update(userId, input) {
      updates.push({ userId, input });
      return Promise.resolve();
    },
  };
}

describe("updateUser", () => {
  it("atualiza e-mail, telefone e papel de outro usuário", async () => {
    const repository = createInMemoryRepository([
      { id: "admin-1", email: "admin@igreja.exemplo", phone: null, role: "admin" },
      { id: "user-2", email: "voluntario@igreja.exemplo", phone: null, role: "fundraiser" },
    ]);

    await updateUser(repository, "admin-1", "user-2", {
      email: "voluntario2@igreja.exemplo",
      phone: "(11) 91234-5678",
      role: "admin",
    });

    expect(repository.updates).toEqual([
      {
        userId: "user-2",
        input: { email: "voluntario2@igreja.exemplo", phone: "11912345678", role: "admin" },
      },
    ]);
  });

  it("ignora o papel solicitado quando o usuário edita a própria conta", async () => {
    const repository = createInMemoryRepository([
      { id: "admin-1", email: "admin@igreja.exemplo", phone: null, role: "admin" },
    ]);

    await updateUser(repository, "admin-1", "admin-1", {
      email: "admin@igreja.exemplo",
      role: "fundraiser",
    });

    expect(repository.updates).toEqual([
      {
        userId: "admin-1",
        input: { email: "admin@igreja.exemplo", phone: undefined, role: "admin" },
      },
    ]);
  });

  it("rejeita e-mail já usado por outro usuário sem persistir nada", async () => {
    const repository = createInMemoryRepository([
      { id: "admin-1", email: "admin@igreja.exemplo", phone: null, role: "admin" },
      { id: "user-2", email: "voluntario@igreja.exemplo", phone: null, role: "fundraiser" },
    ]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        email: "admin@igreja.exemplo",
        role: "fundraiser",
      }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita usuário inexistente", async () => {
    const repository = createInMemoryRepository([]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        email: "voluntario@igreja.exemplo",
        role: "fundraiser",
      }),
    ).rejects.toThrow();
  });
});
