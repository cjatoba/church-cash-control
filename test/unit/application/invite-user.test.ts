import { describe, expect, it } from "vitest";
import { inviteUser, type InviteUserRepository } from "@/server/application/invite-user";

function createInMemoryRepository(existingEmails: string[] = []): InviteUserRepository & {
  created: { email: string; phone?: string; role: string; passwordHash: string }[];
} {
  const created: { email: string; phone?: string; role: string; passwordHash: string }[] = [];
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
};

describe("inviteUser", () => {
  it("cria o usuário com senha temporária gerada e hasheada", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      email: "Voluntario@Igreja.Exemplo",
      phone: "(11) 91234-5678",
      role: "treasurer",
    });

    expect(repository.created).toEqual([
      {
        email: "voluntario@igreja.exemplo",
        phone: "11912345678",
        role: "treasurer",
        passwordHash: "hashed:k7Rt9mQx",
      },
    ]);
    expect(result.temporaryPassword).toBe("k7Rt9mQx");
    expect(result.whatsappLink).toContain("https://wa.me/5511912345678?text=");
  });

  it("não gera link do WhatsApp quando o telefone não é informado", async () => {
    const repository = createInMemoryRepository();

    const result = await inviteUser(repository, dependencies, {
      email: "voluntario@igreja.exemplo",
      role: "admin",
    });

    expect(result.whatsappLink).toBeUndefined();
  });

  it("rejeita convite para e-mail já cadastrado sem criar nada", async () => {
    const repository = createInMemoryRepository(["voluntario@igreja.exemplo"]);

    await expect(
      inviteUser(repository, dependencies, {
        email: "voluntario@igreja.exemplo",
        role: "admin",
      }),
    ).rejects.toThrow();
    expect(repository.created).toHaveLength(0);
  });
});
