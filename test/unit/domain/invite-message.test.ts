import { describe, expect, it } from "vitest";
import { buildTemporaryPasswordWhatsAppLink } from "@/server/domain/invite-message";

describe("buildTemporaryPasswordWhatsAppLink", () => {
  it("monta link do WhatsApp com DDI 55 quando o telefone não tem código de país", () => {
    const link = buildTemporaryPasswordWhatsAppLink(
      "11912345678",
      "voluntario@igreja.exemplo",
      "k7Rt9mQx",
    );

    expect(link).toContain("https://wa.me/5511912345678?text=");
    expect(decodeURIComponent(link.split("text=")[1] ?? "")).toContain("voluntario@igreja.exemplo");
    expect(decodeURIComponent(link.split("text=")[1] ?? "")).toContain("k7Rt9mQx");
  });

  it("mantém o telefone como está quando já inclui código de país", () => {
    const link = buildTemporaryPasswordWhatsAppLink(
      "5511912345678",
      "voluntario@igreja.exemplo",
      "k7Rt9mQx",
    );

    expect(link).toContain("https://wa.me/5511912345678?text=");
  });
});
