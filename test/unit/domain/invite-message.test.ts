import { describe, expect, it } from "vitest";
import { buildAccessWhatsAppLink, type AccessMessage } from "@/server/domain/invite-message";

const invite: AccessMessage = {
  kind: "invite",
  name: "Maria da Silva",
  phone: "11912345678",
  appName: "Caixa da Campanha",
  temporaryPassword: "k7Rt9mQx",
  loginUrl: "https://church-cash-control.vercel.app/login",
};

function messageOf(link: string): string {
  return decodeURIComponent(link.split("text=")[1] ?? "");
}

describe("buildAccessWhatsAppLink", () => {
  it("monta link do WhatsApp com DDI 55 quando o telefone não tem código de país", () => {
    expect(buildAccessWhatsAppLink(invite)).toContain("https://wa.me/5511912345678?text=");
  });

  it("mantém o telefone como está quando já inclui código de país", () => {
    const link = buildAccessWhatsAppLink({ ...invite, phone: "5511912345678" });

    expect(link).toContain("https://wa.me/5511912345678?text=");
  });

  it("no convite, cumprimenta pelo primeiro nome e explica como entrar, passo a passo", () => {
    const message = messageOf(buildAccessWhatsAppLink(invite));

    expect(message.startsWith("Olá, Maria! 👋")).toBe(true);
    expect(message).toContain("Você recebeu acesso ao *Caixa da Campanha*");
    expect(message).toContain("1️⃣ Abra o link: https://church-cash-control.vercel.app/login");
    expect(message).toContain("2️⃣ Celular: *(11) 91234-5678*");
    expect(message).toContain("3️⃣ Senha temporária: *k7Rt9mQx*");
    expect(message).toContain("criar uma senha só sua");
    expect(message).toContain("*Menu → Instalar no celular*");
  });

  it("usa a URL do ambiente informado (ex.: preview) na mensagem", () => {
    const message = messageOf(
      buildAccessWhatsAppLink({
        ...invite,
        loginUrl: "https://church-cash-control-git-feature-branch.vercel.app/login",
      }),
    );

    expect(message).toContain("https://church-cash-control-git-feature-branch.vercel.app/login");
  });

  it("na troca de senha, avisa que a senha foi redefinida em vez de repetir o convite", () => {
    const message = messageOf(buildAccessWhatsAppLink({ ...invite, kind: "password-reset" }));

    expect(message).toContain("Sua senha do *Caixa da Campanha* foi redefinida.");
    expect(message).toContain("3️⃣ Nova senha temporária: *k7Rt9mQx*");
    expect(message).toContain("Se não foi você quem pediu");
    expect(message).not.toContain("Você recebeu acesso");
  });

  it("separa os parágrafos com uma única linha em branco, sem espaço no começo", () => {
    const message = messageOf(buildAccessWhatsAppLink(invite));

    expect(message).not.toMatch(/^\s/);
    expect(message).not.toContain("\n\n\n");
  });
});
