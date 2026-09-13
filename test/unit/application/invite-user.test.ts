import { describe, expect, it } from "vitest";
import { inviteUser, type InviteUserRepository } from "@/server/application/invite-user";

function createInMemoryRepository(existingEmails: string[] = []): InviteUserRepository & {
  created: { email: string; phone?: string; passwordHash: string }[];
} {
  const created: { email: string; phone?: string; passwordHash: string }[] = [];
  return {
    created,
    emailInUse(email) {
      return Promise.resolve(existingEmails.includes(email));
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
  it("cria o usuário com senha temporária gerada e hasheada", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: "on",
    });

    expect(repository.created).toEqual([
      {
        email: "voluntario@igreja.exemplo",
        phone: "11912345678",
        canManageUsers: false,
        canManageCampaigns: false,
        canReceiveFunds: true,
        passwordHash: "hashed:k7Rt9mQx",
      },
    ]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
    expect(decodeURIComponent(result.whatsappLink ?? "")).toContain(dependencies.loginUrl);
  });

  it("não gera link do WhatsApp quando o telefone não é informado", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      email: "voluntario@igreja.exemplo",
      canManageUsers: "on",
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(result.whatsappLink).toBeUndefined();
  });

  it("aceita convite sem nenhuma capacidade marcada (acesso de só visualização)", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      email: "voluntario@igreja.exemplo",
      canManageUsers: undefined,
      canManageCampaigns: undefined,
      canReceiveFunds: undefined,
    });

    expect(result.canManageUsers).toBe(false);
    expect(result.canManageCampaigns).toBe(false);
    expect(result.canReceiveFunds).toBe(false);
  });

  it("rejeita convite para e-mail já cadastrado sem criar nada", async () => {
    const repository = createInMemoryRepository(["voluntario@igreja.exemplo"]);

    await expect(
      inviteUser(repository, dependencies, {
        email: "voluntario@igreja.exemplo",
        canManageUsers: "on",
        canManageCampaigns: undefined,
        canReceiveFunds: undefined,
      }),
    ).rejects.toThrow();
    expect(repository.created).toHaveLength(0);
  });
});
