import { describe, expect, it } from "vitest";
import { updateUser, type UpdateUserRepository } from "@/server/application/update-user";
import type { UserCapabilities } from "@/server/domain/user-capabilities";

interface StoredUser extends UserCapabilities {
  id: string;
  name: string;
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
    phoneInUseByAnotherUser(phone, userId) {
      return Promise.resolve(users.some((user) => user.phone === phone && user.id !== userId));
    },
    update(userId, input) {
      updates.push({ userId, input });
      return Promise.resolve();
    },
  };
}

const admin: StoredUser = {
  id: "admin-1",
  name: "Admin",
  phone: "11900000000",
  canManageUsers: true,
  canManageCampaigns: true,
  canReceiveFunds: true,
};

const fundraiser: StoredUser = {
  id: "user-2",
  name: "Voluntária",
  phone: "11911111111",
  canManageUsers: false,
  canManageCampaigns: false,
  canReceiveFunds: true,
};

const noAccessVolunteer: StoredUser = {
  id: "user-3",
  name: "Voluntário sem acesso",
  phone: null,
  canManageUsers: false,
  canManageCampaigns: false,
  canReceiveFunds: false,
};

describe("updateUser", () => {
  it("atualiza nome, celular e capacidades de outro usuário que já tem acesso", async () => {
    const repository = createInMemoryRepository([admin, fundraiser]);

    await updateUser(repository, "admin-1", "user-2", {
      name: "Voluntária Editada",
      phone: "(11) 91234-5678",
      canManageUsers: "on",
      canManageCampaigns: "on",
      canReceiveFunds: undefined,
    });

    expect(repository.updates).toEqual([
      {
        userId: "user-2",
        input: {
          name: "Voluntária Editada",
          phone: "11912345678",
          canManageUsers: true,
          canManageCampaigns: true,
          canReceiveFunds: false,
        },
      },
    ]);
  });

  it("atualiza só o nome de um voluntário sem acesso ao sistema", async () => {
    const repository = createInMemoryRepository([admin, noAccessVolunteer]);

    await updateUser(repository, "admin-1", "user-3", {
      name: "Nome corrigido",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(repository.updates).toEqual([
      {
        userId: "user-3",
        input: {
          name: "Nome corrigido",
          canManageUsers: false,
          canManageCampaigns: false,
          canReceiveFunds: false,
        },
      },
    ]);
  });

  it("ignora canManageUsers solicitado quando o usuário edita a própria conta, mas aplica as demais", async () => {
    const repository = createInMemoryRepository([admin]);

    await updateUser(repository, "admin-1", "admin-1", {
      name: admin.name,
      phone: admin.phone,
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(repository.updates).toEqual([
      {
        userId: "admin-1",
        input: {
          name: admin.name,
          phone: admin.phone,
          canManageUsers: true,
          canManageCampaigns: false,
          canReceiveFunds: true,
        },
      },
    ]);
  });

  it("rejeita remover o celular de um usuário que já tem acesso", async () => {
    const repository = createInMemoryRepository([admin, fundraiser]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        name: fundraiser.name,
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: "on",
      }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita dar celular a um voluntário sem acesso por aqui — precisa da ativação de acesso", async () => {
    const repository = createInMemoryRepository([admin, noAccessVolunteer]);

    await expect(
      updateUser(repository, "admin-1", "user-3", {
        name: noAccessVolunteer.name,
        phone: "11955554444",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: "on",
      }),
    ).rejects.toThrow();
    expect(repository.updates).toHaveLength(0);
  });

  it("rejeita celular já usado por outro usuário sem persistir nada", async () => {
    const repository = createInMemoryRepository([admin, fundraiser]);

    await expect(
      updateUser(repository, "admin-1", "user-2", {
        name: fundraiser.name,
        phone: admin.phone,
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
        name: "Alguém",
        phone: "11912345678",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: "on",
      }),
    ).rejects.toThrow();
  });
});
