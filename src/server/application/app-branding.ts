import { DEFAULT_APP_BRANDING, parseAppBranding, type AppBranding } from "../domain/app-branding";

export interface AppBrandingRepository {
  find(): Promise<AppBranding | null>;
  save(branding: AppBranding): Promise<void>;
}

export async function getAppBranding(
  repository: Pick<AppBrandingRepository, "find">,
): Promise<AppBranding> {
  return (await repository.find()) ?? DEFAULT_APP_BRANDING;
}

export async function updateAppBranding(
  repository: Pick<AppBrandingRepository, "save">,
  input: unknown,
): Promise<void> {
  await repository.save(parseAppBranding(input));
}
