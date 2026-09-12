import { describe, expect, it } from "vitest";
import { buildTemporaryPasswordWhatsAppLink } from "@/server/domain/invite-message";

describe("buildTemporaryPasswordWhatsAppLink", () => {
  it("monta link do WhatsApp com DDI 55 quando o telefone não tem código de país", () => {
    const link = buildTemporaryPasswordWhatsAppLink(
      "11912345678",
      "voluntario@igreja.exemplo",
      "k7Rt9mQx",
      "https://church-cash-control.vercel.app/login",
    );

    expect(link).toContain("https://wa.me/5511912345678?text=");
    const message = decodeURIComponent(link.split("text=")[1] ?? "");
    expect(message).toContain("voluntario@igreja.exemplo");
    expect(message).toContain("k7Rt9mQx");
    expect(message).toContain("https://church-cash-control.vercel.app/login");
  });

  it("mantém o telefone como está quando já inclui código de país", () => {
    const link = buildTemporaryPasswordWhatsAppLink(
      "5511912345678",
      "voluntario@igreja.exemplo",
      "k7Rt9mQx",
      "https://church-cash-control.vercel.app/login",
    );

    expect(link).toContain("https://wa.me/5511912345678?text=");
  });

  it("usa a URL do ambiente informado (ex.: preview) na mensagem", () => {
    const link = buildTemporaryPasswordWhatsAppLink(
      "11912345678",
      "voluntario@igreja.exemplo",
      "k7Rt9mQx",
      "https://church-cash-control-git-feature-branch.vercel.app/login",
    );

    const message = decodeURIComponent(link.split("text=")[1] ?? "");
    expect(message).toContain("https://church-cash-control-git-feature-branch.vercel.app/login");
  });
});
