import { z } from "zod";

export const appIcons = [
  "dollar",
  "church",
  "cross",
  "bible",
  "dove",
  "fish",
  "heart",
  "flame",
  "crown",
  "star",
  "safe",
  "initial",
] as const;
export type AppIcon = (typeof appIcons)[number];

export const appIconColors = [
  "green",
  "blue",
  "navy",
  "purple",
  "wine",
  "orange",
  "gold",
  "graphite",
] as const;
export type AppIconColor = (typeof appIconColors)[number];

export interface AppBranding {
  name: string;
  shortName: string;
  icon: AppIcon;
  color: AppIconColor;
}

export const DEFAULT_APP_BRANDING: AppBranding = {
  name: "Controle de Caixa",
  shortName: "Caixa",
  icon: "dollar",
  color: "green",
};

const appBrandingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome do app é obrigatório")
    .max(40, "Nome do app pode ter no máximo 40 letras"),
  shortName: z
    .string()
    .trim()
    .min(1, "Nome curto é obrigatório")
    .max(12, "Nome curto pode ter no máximo 12 letras"),
  icon: z.enum(appIcons),
  color: z.enum(appIconColors),
});

export function parseAppBranding(input: unknown): AppBranding {
  return appBrandingSchema.parse(input);
}
