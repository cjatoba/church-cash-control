import { describe, expect, it } from "vitest";
import {
  listUsers,
  type UserListRepository,
  type UserOption,
} from "@/server/application/list-users";

function createInMemoryUserListRepository(users: UserOption[]): UserListRepository {
  return {
    findAll() {
      return Promise.resolve(users);
    },
  };
}

describe("listUsers", () => {
  it("retorna os usuários cadastrados", async () => {
    const user: UserOption = { id: "user-1", email: "clayton@example.com" };
    const repository = createInMemoryUserListRepository([user]);

    const result = await listUsers(repository);

    expect(result).toEqual([user]);
  });

  it("retorna lista vazia quando não há usuários cadastrados", async () => {
    const repository = createInMemoryUserListRepository([]);

    const result = await listUsers(repository);

    expect(result).toEqual([]);
  });
});
