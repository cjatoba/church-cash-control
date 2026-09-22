import { describe, expect, it } from "vitest";
import {
  activateUserAccess,
  type ActivateUserAccessRepository,
} from "@/server/application/activate-user-access";
import type { UserCapabilities } from "@/server/domain/user-capabilities";

interface StoredUser extends UserCapabilities {
  id: string;
  name: string;
  phone: string | null;
}

function createInMemoryRepository(
  users: StoredUser[],
): ActivateUserAccessRepository & { activations: { userId: string; input: unknown }[] } {
  const activations: { userId: string; input: unknown }[] = [];
  return {
    activations,
    findUserForEdit(userId) {
      return Promise.resolve(users.find((user) => user.id === userId) ?? null);
    },
    phoneInUse(phone) {
      return Promise.resolve(users.some((user) => user.phone === phone));
    },
    activate(userId, input) {
      activations.push({ userId, input });
      return Promise.resolve();
    },
  };
}

const dependencies = {
  generateTemporaryPassword: () => "k7Rt9mQx",
  hashPassword: (password: string) => Promise.resolve(`hashed:${password}`),
  loginUrl: "https://church-cash-control.vercel.app/login",
};

const noAccessVolunteer: StoredUser = {
  id: "user-1",
  name: "João Pereira",
  phone: null,
  canManageUsers: false,
  canManageCampaigns: false,
  canReceiveFunds: false,
};

const admin: StoredUser = {
  id: "admin-1",
  name: "Admin",
  phone: "11900000000",
  canManageUsers: true,
  canManageCampaigns: true,
  canReceiveFunds: true,
};

describe("activateUserAccess", () => {
  it("dá celular e senha temporária a um voluntário sem acesso, com link do WhatsApp", async () => {
    const repository = createInMemoryRepository([noAccessVolunteer]);

    const result = await activateUserAccess(repository, dependencies, "user-1", {
      phone: "(11) 91234-5678",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(repository.activations).toEqual([
      {
        userId: "user-1",
        input: {
          phone: "11912345678",
          canManageUsers: false,
          canManageCampaigns: false,
          canReceiveFunds: true,
          passwordHash: "hashed:k7Rt9mQx",
        },
      },
    ]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
  });

  it("rejeita ativar quem já tem acesso ao sistema", async () => {
    const repository = createInMemoryRepository([admin]);

    await expect(
      activateUserAccess(repository, dependencies, "admin-1", {
        phone: "11955554444",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).rejects.toThrow();
    expect(repository.activations).toHaveLength(0);
  });

  it("rejeita celular já usado por outro usuário", async () => {
    const repository = createInMemoryRepository([noAccessVolunteer, admin]);

    await expect(
      activateUserAccess(repository, dependencies, "user-1", {
        phone: admin.phone,
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).rejects.toThrow();
    expect(repository.activations).toHaveLength(0);
  });

  it("rejeita usuário inexistente", async () => {
    const repository = createInMemoryRepository([]);

    await expect(
      activateUserAccess(repository, dependencies, "user-1", {
        phone: "11955554444",
        canManageUsers: undefined,
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).rejects.toThrow();
  });
});
