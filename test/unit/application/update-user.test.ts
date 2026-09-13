import { describe, expect, it } from "vitest";
import { updateUser, type UpdateUserRepository } from "@/server/application/update-user";
import type { UserCapabilities } from "@/server/domain/user-capabilities";

interface StoredUser extends UserCapabilities {
  id: string;
  email: string;
  phone: string | null;
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

const admin: StoredUser = {
  id: "admin-1",
  email: "admin@igreja.exemplo",
  phone: null,
  canManageUsers: true,
  canManageCampaigns: true,
  canReceiveFunds: true,
};

const fundraiser: StoredUser = {
  id: "user-2",
  email: "voluntario@igreja.exemplo",
  phone: null,
  canManageUsers: false,
  canManageCampaigns: false,
  canReceiveFunds: true,
};

describe("updateUser", () => {
  it("atualiza e-mail, telefone e capacidades de outro usuário", async () => {
    const repository = createInMemoryRepository([admin, fundraiser]);

    await updateUser(repository, "admin-1", "user-2", {
      email: "voluntario2@igreja.exemplo",
      phone: "(11) 91234-5678",
      canManageUsers: "on",
      canManageCampaigns: "on",
      canReceiveFunds: undefined,
    });

    expect(repository.updates).toEqual([
      {
        userId: "user-2",
        input: {
          email: "voluntario2@igreja.exemplo",
          phone: "11912345678",
          canManageUsers: true,
          canManageCampaigns: true,
          canReceiveFunds: false,
        },
      },
    ]);
  });

  it("ignora canManageUsers solicitado quando o usuário edita a própria conta, mas aplica as demais", async () => {
    const repository = createInMemoryRepository([admin]);

    await updateUser(repository, "admin-1", "admin-1", {
      email: "admin@igreja.exemplo",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(repository.updates).toEqual([
      {
        userId: "admin-1",
        input: {
          email: "admin@igreja.exemplo",
          phone: undefined,
          canManageUsers: true,
          canManageCampaigns: false,
          canReceiveFunds: true,
        },
      },
    ]);
  });

  it("rejeita e-mail já usado por outro usuário sem persistir nada", async () => {
    const repository = createInMemoryRepository([admin, fundraiser]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        email: "admin@igreja.exemplo",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: "on",
      }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita usuário inexistente", async () => {
    const repository = createInMemoryRepository([]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        email: "voluntario@igreja.exemplo",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: "on",
      }),
    ).rejects.toThrow();
  });
});
