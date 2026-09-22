import { describe, expect, it } from "vitest";
import { inviteUser, type InviteUserRepository } from "@/server/application/invite-user";

function createInMemoryRepository(existingPhones: string[] = []): InviteUserRepository & {
  created: { phone: string; passwordHash: string }[];
} {
  const created: { phone: string; passwordHash: string }[] = [];
  return {
    created,
    phoneInUse(phone) {
      return Promise.resolve(existingPhones.includes(phone));
    },
    create(input) {
      created.push(input);
      return Promise.resolve({ id: "user-1" });
    },
  };
}

const dependencies = {
  generateTemporaryPassword: () => "k7Rt9mQx",
  hashPassword: (password: string) => Promise.resolve(`hashed:${password}`),
  loginUrl: "https://church-cash-control.vercel.app/login",
};

describe("inviteUser", () => {
  it("cria o usuário com senha temporária gerada e hasheada, e sempre gera link do WhatsApp", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      phone: "(11) 91234-5678",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(repository.created).toEqual([
      {
        phone: "11912345678",
        canManageUsers: false,
        canManageCampaigns: false,
        canReceiveFunds: true,
        passwordHash: "hashed:k7Rt9mQx",
      },
    ]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
    expect(decodeURIComponent(result.whatsappLink)).toContain(dependencies.loginUrl);
  });

  it("aceita convite sem nenhuma capacidade marcada (acesso de só visualização)", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      phone: "11912345678",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(result.canManageUsers).toBe(false);
    expect(result.canManageCampaigns).toBe(false);
    expect(result.canReceiveFunds).toBe(false);
  });

  it("rejeita convite para celular já cadastrado sem criar nada", async () => {
    const repository = createInMemoryRepository(["11912345678"]);

    await expect(
      inviteUser(repository, dependencies, {
        phone: "11912345678",
        canManageUsers: "on",
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).rejects.toThrow();
    expect(repository.created).toHaveLength(0);
  });
});
