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
  it("retorna os usuários cadastrados com papel e telefone", async () => {
    const user: ManagedUser = {
      id: "user-1",
      email: "admin@igreja.exemplo",
      phone: null,
      role: "admin",
      mustChangePassword: false,
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
