import { describe, expect, it } from "vitest";
import {
  getAppBranding,
  updateAppBranding,
  type AppBrandingRepository,
} from "@/server/application/app-branding";
import { DEFAULT_APP_BRANDING, type AppBranding } from "@/server/domain/app-branding";

function createInMemoryRepository(initial: AppBranding | null): AppBrandingRepository & {
  stored: () => AppBranding | null;
} {
  let current = initial;
  return {
    find() {
      return Promise.resolve(current);
    },
    save(branding) {
      current = branding;
      return Promise.resolve();
    },
    stored: () => current,
  };
}

describe("getAppBranding", () => {
  it("usa a configuração padrão enquanto ninguém personalizou o app", async () => {
    const branding = await getAppBranding(createInMemoryRepository(null));

    expect(branding).toEqual(DEFAULT_APP_BRANDING);
  });

  it("retorna a configuração salva", async () => {
    const saved: AppBranding = { name: "App X", shortName: "X", icon: "cross", color: "wine" };

    const branding = await getAppBranding(createInMemoryRepository(saved));

    expect(branding).toEqual(saved);
  });
});

describe("updateAppBranding", () => {
  it("valida e salva a nova configuração", async () => {
    const repository = createInMemoryRepository(null);

    await updateAppBranding(repository, {
      name: " App X ",
      shortName: "X",
      icon: "dove",
      color: "purple",
    });

    expect(repository.stored()).toEqual({
      name: "App X",
      shortName: "X",
      icon: "dove",
      color: "purple",
    });
  });

  it("não salva nada quando a configuração é inválida", async () => {
    const repository = createInMemoryRepository(null);

    await expect(
      updateAppBranding(repository, { name: "", shortName: "X", icon: "dove", color: "purple" }),
    ).rejects.toThrow();
    expect(repository.stored()).toBeNull();
  });
});
