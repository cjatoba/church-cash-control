import { z } from "zod";

export const THEME_COOKIE_NAME = "theme";

const themePreferenceSchema = z.enum(["system", "light", "dark"]);

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export function parseThemePreference(value: string | undefined): ThemePreference {
  const result = themePreferenceSchema.safeParse(value);
  return result.success ? result.data : "system";
}
