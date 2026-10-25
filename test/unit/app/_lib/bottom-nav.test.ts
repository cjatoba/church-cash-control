import { describe, expect, it } from "vitest";
import { selectBottomNavTab } from "@/app/_lib/bottom-nav";

describe("selectBottomNavTab", () => {
  it("marca Início na tela inicial e nas telas de campanha", () => {
    expect(selectBottomNavTab("/")).toBe("home");
    expect(selectBottomNavTab("/campaigns/abc")).toBe("home");
    expect(selectBottomNavTab("/campaigns/abc/pledges/def/change-type")).toBe("home");
    expect(selectBottomNavTab("/campaigns/new")).toBe("home");
  });

  it("marca Menu nas telas abertas pelo menu", () => {
    expect(selectBottomNavTab("/account/password")).toBe("menu");
    expect(selectBottomNavTab("/install")).toBe("menu");
    expect(selectBottomNavTab("/help")).toBe("menu");
    expect(selectBottomNavTab("/users/abc/edit")).toBe("menu");
    expect(selectBottomNavTab("/app-settings")).toBe("menu");
    expect(selectBottomNavTab("/activity-log")).toBe("menu");
  });

  it("esconde a barra no login, na troca de senha obrigatória e no tutorial", () => {
    expect(selectBottomNavTab("/login")).toBeNull();
    expect(selectBottomNavTab("/change-password")).toBeNull();
    expect(selectBottomNavTab("/tutorial")).toBeNull();
  });

  it("não confunde rota com prefixo parecido", () => {
    expect(selectBottomNavTab("/helpers")).toBe("home");
    expect(selectBottomNavTab("/login-help")).toBe("home");
  });
});
