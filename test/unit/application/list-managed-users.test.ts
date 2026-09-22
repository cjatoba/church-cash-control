import { describe, expect, it } from "vitest";
import {
  listManagedUsers,
  type ManagedUser,
  type ManagedUserListRepository,
} from "@/server/application/list-managed-users";

function createInMemoryRepository(users: ManagedUser[]): ManagedUserListRepository {
  return {
    findAll() {
      return Promise.resolve(users);
    },
  };
}

describe("listManagedUsers", () => {
  it("retorna os usuários cadastrados com nome, capacidades e celular", async () => {
    const user: ManagedUser = {
      id: "user-1",
      name: "Admin",
      phone: "11955554444",
      canManageUsers: true,
      canManageCampaigns: true,
      canReceiveFunds: true,
      mustChangePassword: false,
      active: true,
    };
    const repository = createInMemoryRepository([user]);

    const result = await listManagedUsers(repository);

    expect(result).toEqual([user]);
  });

  it("retorna voluntário sem acesso ao sistema (sem celular)", async () => {
    const user: ManagedUser = {
      id: "user-2",
      name: "Voluntário sem acesso",
      phone: null,
      canManageUsers: false,
      canManageCampaigns: false,
      canReceiveFunds: false,
      mustChangePassword: false,
      active: true,
    };
    const repository = createInMemoryRepository([user]);

    const result = await listManagedUsers(repository);

    expect(result).toEqual([user]);
  });

  it("retorna lista vazia quando não há usuários cadastrados", async () => {
    const repository = createInMemoryRepository([]);

    const result = await listManagedUsers(repository);

    expect(result).toEqual([]);
  });
});
