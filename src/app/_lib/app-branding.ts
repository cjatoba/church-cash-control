import { unstable_cache } from "next/cache";
import { getAppBranding } from "@/server/application/app-branding";
import { createAppSettingsRepository } from "@/server/infrastructure/db/app-settings-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

export const APP_BRANDING_CACHE_TAG = "app-branding";

// Nome e ícone aparecem em toda página (título, manifesto, ícones), mas quase
// nunca mudam: o cache evita uma consulta ao banco por página aberta e é
// invalidado pela própria tela de personalização ao salvar.
export const getCachedAppBranding = unstable_cache(
  () => getAppBranding(createAppSettingsRepository(createDbClient())),
  ["app-branding"],
  { tags: [APP_BRANDING_CACHE_TAG] },
);
