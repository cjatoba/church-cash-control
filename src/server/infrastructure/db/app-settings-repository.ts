import { eq } from "drizzle-orm";
import type { AppBrandingRepository } from "@/server/application/app-branding";
import { parseAppBranding } from "@/server/domain/app-branding";
import type { DbClient } from "./client";
import { appSettings } from "./schema";

const APP_SETTINGS_ID = "app";

export function createAppSettingsRepository(db: DbClient): AppBrandingRepository {
  return {
    async find() {
      const [row] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.id, APP_SETTINGS_ID))
        .limit(1);

      return row ? parseAppBranding(row) : null;
    },

    async save(branding) {
      const values = { ...branding, updatedAt: new Date() };
      await db
        .insert(appSettings)
        .values({ id: APP_SETTINGS_ID, ...values })
        .onConflictDoUpdate({ target: appSettings.id, set: values });
    },
  };
}
